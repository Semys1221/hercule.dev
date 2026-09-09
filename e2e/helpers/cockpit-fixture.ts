import type { APIRequestContext } from "@playwright/test";

import { deleteSeedClient, isSeedSlug } from "@/lib/admin/clients/seed";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";

import {
  getAgenceIdBySlug,
  getAgenceProductStatut,
  getEntrepriseIdBySlug,
  pollAgenceProductStatut,
  TEST_AGENCE_EMAIL,
  TEST_AGENCE_SLUG,
  TEST_ENTREPRISE_ACME_SLUG,
  TEST_ENTREPRISE_BRAVO_SLUG,
} from "./supabase-assertions";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://127.0.0.1:3000";

export async function assertServerReachable(request: APIRequestContext): Promise<void> {
  const response = await request.get(`${BASE_URL}/api/admin/clients?category=agence&all=true`);
  if (!response.ok()) {
    throw new Error(
      `Dev server not reachable at ${BASE_URL} (HTTP ${response.status()}). Run pnpm dev first.`,
    );
  }
}

async function forcePurgeTestAgenceByEmail(): Promise<void> {
  const client = createLinkTrackingClient();
  const { data: rows } = await client
    .from("agence")
    .select("id, slug")
    .ilike("email", TEST_AGENCE_EMAIL);

  for (const row of rows ?? []) {
    const leadId = row.id as string;
    const slug = row.slug as string;

    await client.from("appointments").delete().eq("agence_id", leadId);
    await client.from("agence").update({ active_match_id: null }).eq("id", leadId);
    await client.from("matches").delete().eq("agence_id", leadId);
    await client.from("payments").delete().eq("agence_id", leadId);
    await client.from("sales_calls").delete().eq("agence_id", leadId);
    await client.from("booking_email_jobs").delete().eq("lead_id", leadId).eq("lead_category", "agence");
    await client.from("agence").delete().eq("id", leadId);

    if (isSeedSlug(slug)) {
      try {
        await deleteSeedClient(client, "agence", slug);
      } catch {
        // already removed
      }
    }
  }
}

export async function cleanupSalesSession(request: APIRequestContext): Promise<void> {
  await forcePurgeTestAgenceByEmail();

  const response = await request.delete(
    `${BASE_URL}/api/admin/clients/agence/${TEST_AGENCE_SLUG}`,
  );
  if (response.status() === 404) return;
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`cleanup failed: ${response.status()} ${body}`);
  }

  await forcePurgeTestAgenceByEmail();
}

export async function provisionSalesSession(request: APIRequestContext): Promise<void> {
  const response = await request.post(`${BASE_URL}/api/admin/sales-funnel/test-meeting`, {
    data: { audience: "agence" },
  });
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`provision test meeting failed: ${response.status()} ${body}`);
  }
}

export async function seedDemoClients(request: APIRequestContext): Promise<void> {
  const response = await request.post(`${BASE_URL}/api/admin/clients/seed`);
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`seed demo clients failed: ${response.status()} ${body}`);
  }
}

export async function skipPayment(request: APIRequestContext, slug: string): Promise<void> {
  const response = await request.post(`${BASE_URL}/api/dashboard/${slug}/dev-skip-payment`);
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`dev-skip-payment failed: ${response.status()} ${body}`);
  }
}

export async function completeOnboardingApi(request: APIRequestContext, slug: string): Promise<void> {
  const dashboard = await request.get(`${BASE_URL}/api/dashboard/${slug}`);
  if (!dashboard.ok()) {
    throw new Error(`dashboard GET failed: ${dashboard.status()}`);
  }
  const data = (await dashboard.json()) as { form?: Record<string, unknown> };

  const response = await request.patch(`${BASE_URL}/api/dashboard/${slug}`, {
    data: {
      form: data.form ?? {},
      tieDownAccepted: true,
      completeOnboarding: true,
      cgvVersion: "2026-09-09",
      waiveRetraction: true,
    },
  });
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`complete onboarding failed: ${response.status()} ${body}`);
  }

  const statut = await getAgenceProductStatut(slug);
  if (statut !== "IN_DELIVERANCE") {
    const response = await request.patch(`${BASE_URL}/api/admin/clients/agence/${slug}/statut`, {
      data: { statut: "IN_DELIVERANCE" },
    });
    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`force IN_DELIVERANCE failed: ${response.status()} ${body}`);
    }
  }

  await pollAgenceProductStatut(slug, "IN_DELIVERANCE");
}

export async function createMatchViaApi(
  request: APIRequestContext,
  entrepriseSlug: string,
): Promise<string> {
  const agenceId = await getAgenceIdBySlug(TEST_AGENCE_SLUG);
  const entrepriseId = await getEntrepriseIdBySlug(entrepriseSlug);

  const response = await request.post(`${BASE_URL}/api/admin/matches`, {
    data: { agenceId, entrepriseId },
  });
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`create match failed: ${response.status()} ${body}`);
  }

  const json = (await response.json()) as { matchId?: string; match?: { id?: string } };
  const matchId = json.matchId ?? json.match?.id;
  if (!matchId) {
    throw new Error(`create match response missing id: ${JSON.stringify(json)}`);
  }
  return matchId;
}

export async function createScheduledAppointment(
  request: APIRequestContext,
  matchId: string,
): Promise<string> {
  const scheduledAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const inviteeUri = `https://api.calendly.com/scheduled_events/e2e/invitees/${matchId}-${Date.now()}`;

  const response = await request.post(`${BASE_URL}/api/webhooks/calendly`, {
    data: {
      event: "invitee.created",
      payload: {
        uri: inviteeUri,
        email: TEST_AGENCE_EMAIL,
        name: "Agence Test",
        tracking: { utm_content: `match:${matchId}` },
        scheduled_event: {
          uri: `https://api.calendly.com/scheduled_events/e2e/${matchId}`,
          start_time: scheduledAt,
        },
      },
    },
  });
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`calendly match booking webhook failed: ${response.status()} ${body}`);
  }

  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("appointments")
    .select("id")
    .eq("match_id", matchId)
    .eq("status", "scheduled")
    .maybeSingle();
  if (error || !data) {
    throw new Error(`scheduled appointment not found for match ${matchId}`);
  }
  return data.id as string;
}

export async function bootstrapDryRunClient(request: APIRequestContext): Promise<void> {
  await cleanupSalesSession(request);
  await provisionSalesSession(request);
  await seedDemoClients(request);
  await skipPayment(request, TEST_AGENCE_SLUG);
  await completeOnboardingApi(request, TEST_AGENCE_SLUG);
}

export async function bootstrapLiveRunClient(request: APIRequestContext): Promise<void> {
  await cleanupSalesSession(request);
  await provisionSalesSession(request);
  await seedDemoClients(request);
}

export async function createAcmeMatchWithAppointment(request: APIRequestContext): Promise<{
  matchId: string;
  appointmentId: string;
}> {
  const matchId = await createMatchViaApi(request, TEST_ENTREPRISE_ACME_SLUG);
  const appointmentId = await createScheduledAppointment(request, matchId);
  return { matchId, appointmentId };
}

export async function createBravoMatchWithAppointment(request: APIRequestContext): Promise<{
  matchId: string;
  appointmentId: string;
}> {
  const matchId = await createMatchViaApi(request, TEST_ENTREPRISE_BRAVO_SLUG);
  const appointmentId = await createScheduledAppointment(request, matchId);
  return { matchId, appointmentId };
}

export async function triggerBookingEmailsCron(request: APIRequestContext): Promise<void> {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    throw new Error("CRON_SECRET is not set");
  }
  const response = await request.fetch(`${BASE_URL}/api/cron/booking-emails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`booking-emails cron failed: ${response.status()} ${body}`);
  }
}
