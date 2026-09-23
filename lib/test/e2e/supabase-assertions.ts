import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import type { BookingEmailType } from "@/lib/legacy/booking-communication/types";

import { SALES_TEST_SESSION_EMAIL } from "@/lib/legacy/admin/funnels/sales-test-session-preset";

export const TEST_AGENCE_SLUG = "seed-sales-session";
export const TEST_AGENCE_EMAIL = SALES_TEST_SESSION_EMAIL;
export const TEST_ENTREPRISE_ACME_SLUG = "seed-acme-corp";
export const TEST_ENTREPRISE_BRAVO_SLUG = "seed-bravo-sas";

export type EmailJobExpectation = {
  emailType: BookingEmailType;
  status?: "pending" | "sent" | "failed" | "cancelled";
  allowedStatuses?: Array<"pending" | "sent" | "failed" | "cancelled">;
};

export async function getAgenceIdBySlug(slug: string): Promise<string> {
  const client = createLinkTrackingClient();
  const { data, error } = await client.from("agence").select("id").eq("slug", slug).maybeSingle();
  if (error || !data) {
    throw new Error(`agence not found for slug ${slug}: ${error?.message ?? "missing"}`);
  }
  return data.id as string;
}

export async function getEntrepriseIdBySlug(slug: string): Promise<string> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("entreprise")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) {
    throw new Error(`entreprise not found for slug ${slug}: ${error?.message ?? "missing"}`);
  }
  return data.id as string;
}

export async function getAgenceProductStatut(slug: string): Promise<string> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("agence")
    .select("product_statut")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) {
    throw new Error(`agence statut lookup failed: ${error?.message ?? "missing"}`);
  }
  return data.product_statut as string;
}

export async function getEntrepriseProductStatut(slug: string): Promise<string> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("entreprise")
    .select("product_statut")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) {
    throw new Error(`entreprise statut lookup failed: ${error?.message ?? "missing"}`);
  }
  return data.product_statut as string;
}

export async function getLatestMatchForAgence(agenceId: string): Promise<{
  id: string;
  status: string;
  search_started_at: string | null;
}> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("matches")
    .select("id, status, search_started_at")
    .eq("agence_id", agenceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) {
    throw new Error(`match not found for agence ${agenceId}: ${error?.message ?? "missing"}`);
  }
  return data as { id: string; status: string; search_started_at: string | null };
}

export async function getScheduledAppointmentsForAgence(agenceId: string): Promise<
  Array<{ id: string; status: string; survey_token_agence: string | null }>
> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("appointments")
    .select("id, status, survey_token_agence")
    .eq("agence_id", agenceId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`appointments lookup failed: ${error.message}`);
  }
  return (data ?? []) as Array<{ id: string; status: string; survey_token_agence: string | null }>;
}

export async function assertEmailJobsForLead(
  category: "agence" | "entreprise",
  leadId: string,
  expectations: EmailJobExpectation[],
): Promise<void> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("booking_email_jobs")
    .select("email_type, status")
    .eq("lead_category", category)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`booking_email_jobs lookup failed: ${error.message}`);
  }

  const rows = data ?? [];
  for (const expected of expectations) {
    const match = rows.find((row) => row.email_type === expected.emailType);
    if (!match) {
      throw new Error(
        `Expected email job ${expected.emailType} for ${category}/${leadId}, found: ${rows
          .map((row) => row.email_type)
          .join(", ")}`,
      );
    }
    if (expected.status && match.status !== expected.status) {
      throw new Error(
        `Expected ${expected.emailType} status ${expected.status}, got ${match.status}`,
      );
    }
    if (expected.allowedStatuses && !expected.allowedStatuses.includes(match.status as EmailJobExpectation["status"])) {
      throw new Error(
        `Expected ${expected.emailType} status in ${expected.allowedStatuses.join(", ")}, got ${match.status}`,
      );
    }
  }
}

export async function assertTimelineFirstStepActive(slug: string): Promise<void> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("agence")
    .select("profile")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) {
    throw new Error(`agence profile lookup failed: ${error?.message ?? "missing"}`);
  }

  const profile = data.profile as { display?: { timeline?: Array<{ status: string }> } } | null;
  const timeline = profile?.display?.timeline ?? [];
  if (timeline.length === 0) {
    throw new Error("timeline is empty");
  }
  if (timeline[0]?.status !== "active") {
    throw new Error(`Expected first timeline step active, got ${timeline[0]?.status}`);
  }
}

export async function assertTimelineLabel(slug: string, label: string): Promise<void> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("agence")
    .select("profile")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) {
    throw new Error(`agence profile lookup failed: ${error?.message ?? "missing"}`);
  }

  const profile = data.profile as { display?: { timeline?: Array<{ label: string }> } } | null;
  const timeline = profile?.display?.timeline ?? [];
  const found = timeline.some((step) => step.label === label);
  if (!found) {
    throw new Error(`Timeline label "${label}" not found in ${JSON.stringify(timeline)}`);
  }
}

export async function pollAgenceProductStatut(
  slug: string,
  expected: string,
  timeoutMs = 30_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const statut = await getAgenceProductStatut(slug);
    if (statut === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for agence ${slug} product_statut=${expected}`);
}

export async function pollPaymentSucceeded(slug: string, timeoutMs = 45_000): Promise<void> {
  const client = createLinkTrackingClient();
  const agenceId = await getAgenceIdBySlug(slug);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data } = await client
      .from("payments")
      .select("status")
      .eq("agence_id", agenceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.status === "succeeded") return;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error(`Timed out waiting for payment succeeded for ${slug}`);
}

export type DecTrialClientRow = {
  id: string;
  slug: string;
  email: string;
  client_type: string;
  offer_type: string;
  product_statut: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

export type DecTrialPaymentRow = {
  id: string;
  client_id: string;
  status: string;
  stripe_checkout_session_id: string | null;
  succeeded_at: string | null;
};

export async function getClientIdBySlug(slug: string): Promise<string> {
  const client = createLinkTrackingClient();
  const { data, error } = await client.from("clients").select("id").eq("slug", slug).maybeSingle();
  if (error || !data) {
    throw new Error(`client not found for slug ${slug}: ${error?.message ?? "missing"}`);
  }
  return data.id as string;
}

export async function getDecTrialClientBySlug(slug: string): Promise<DecTrialClientRow> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("clients")
    .select(
      "id, slug, email, client_type, offer_type, product_statut, stripe_customer_id, stripe_subscription_id",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) {
    throw new Error(`client lookup failed for ${slug}: ${error?.message ?? "missing"}`);
  }
  return data as DecTrialClientRow;
}

export async function getDecTrialPaymentBySessionId(
  sessionId: string,
): Promise<DecTrialPaymentRow> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("payments")
    .select("id, client_id, status, stripe_checkout_session_id, succeeded_at")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  if (error || !data) {
    throw new Error(
      `payment not found for session ${sessionId}: ${error?.message ?? "missing"}`,
    );
  }
  return data as DecTrialPaymentRow;
}

export async function getDecTrialEmailJobs(clientId: string): Promise<
  Array<{
    id: string;
    email_type: string;
    status: string;
    triggered_by: string;
    idempotency_key: string;
    sent_at: string | null;
  }>
> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("booking_email_jobs")
    .select("id, email_type, status, triggered_by, idempotency_key, sent_at")
    .eq("lead_category", "client")
    .eq("lead_id", clientId)
    .eq("email_type", "free_trial_started_1")
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`booking_email_jobs lookup failed: ${error.message}`);
  }
  return (data ?? []) as Array<{
    id: string;
    email_type: string;
    status: string;
    triggered_by: string;
    idempotency_key: string;
    sent_at: string | null;
  }>;
}

export async function pollClientPaymentSucceeded(
  clientId: string,
  timeoutMs = 30_000,
): Promise<DecTrialPaymentRow> {
  const client = createLinkTrackingClient();
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data } = await client
      .from("payments")
      .select("id, client_id, status, stripe_checkout_session_id, succeeded_at")
      .eq("client_id", clientId)
      .eq("offer_type", "monthly_1499_trial")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.status === "succeeded") {
      return data as DecTrialPaymentRow;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for succeeded payment for client ${clientId}`);
}

export async function pollDecTrialStartedEmailJob(
  clientId: string,
  timeoutMs = 30_000,
): Promise<{ status: string; idempotency_key: string }> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const jobs = await getDecTrialEmailJobs(clientId);
    const sent = jobs.find((job) => job.status === "sent");
    if (sent) {
      return { status: sent.status, idempotency_key: sent.idempotency_key };
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  const latest = await getDecTrialEmailJobs(clientId);
  throw new Error(
    `Timed out waiting for free_trial_started_1 sent job; latest: ${JSON.stringify(latest)}`,
  );
}

export async function getSurveyTokenForLatestCompletedAppointment(
  agenceId: string,
): Promise<string> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("appointments")
    .select("survey_token_agence")
    .eq("agence_id", agenceId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data?.survey_token_agence) {
    throw new Error(`survey token not found: ${error?.message ?? "missing"}`);
  }
  return data.survey_token_agence as string;
}
