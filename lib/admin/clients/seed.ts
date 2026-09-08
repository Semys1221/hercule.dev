import type { SupabaseClient } from "@supabase/supabase-js";

import { DEFAULT_TIMELINE } from "@/lib/admin/clients/types";
import { buildDashboardUrl, buildLeadUrls } from "@/lib/link-tracking/urls";
import type { LeadCategory } from "@/lib/link-tracking/types";

export const SEED_PREFIX = "seed-";

export function isSeedSlug(slug: string): boolean {
  return slug.startsWith(SEED_PREFIX);
}

export function isSeedEmail(email: string): boolean {
  return email.toLowerCase().startsWith(SEED_PREFIX);
}

const AGENCES = [
  {
    slug: `${SEED_PREFIX}omega-design`,
    email: "seed-omega@example.com",
    first_name: "Léa",
    company: "Agence Omega Design",
    product_statut: "PAID_PENDING_ONBOARDING",
    onboarding_completed_at: null as string | null,
    paid: true,
    form: {
      specialites: ["Branding", "Site vitrine"],
      capacite: 4,
      budgetMinPonctuel: 8000,
      budgetMinMensuel: 2500,
    },
  },
  {
    slug: `${SEED_PREFIX}beta-studio`,
    email: "seed-beta@example.com",
    first_name: "Marc",
    company: "Agence Beta Studio",
    product_statut: "IN_DELIVERANCE",
    onboarding_completed_at: new Date().toISOString(),
    paid: true,
    form: {
      specialites: ["SEO", "Content"],
      zone: "Île-de-France",
      capacite: 6,
      budgetMinPonctuel: 12000,
      budgetMinMensuel: 4000,
    },
  },
  {
    slug: `${SEED_PREFIX}gamma-dev`,
    email: "seed-gamma@example.com",
    first_name: "Nina",
    company: "Agence Gamma Dev",
    product_statut: "MEETING_BOOKED",
    onboarding_completed_at: new Date().toISOString(),
    paid: true,
    form: {
      specialites: ["Product", "Dev"],
      zone: "Lyon",
      capacite: 3,
      budgetMinPonctuel: 15000,
      budgetMinMensuel: 5000,
    },
  },
] as const;

const ENTREPRISES = [
  {
    slug: `${SEED_PREFIX}acme-corp`,
    email: "seed-acme@example.com",
    first_name: "Paul",
    company: "Entreprise Acme Corp",
    product_statut: "NONE",
  },
  {
    slug: `${SEED_PREFIX}bravo-sas`,
    email: "seed-bravo@example.com",
    first_name: "Chloé",
    company: "Entreprise Bravo SAS",
    product_statut: "MATCH_PROPOSED",
  },
] as const;

export const SEED_SLUGS = [
  ...AGENCES.map((row) => row.slug),
  ...ENTREPRISES.map((row) => row.slug),
];

async function upsertLead(
  client: SupabaseClient,
  table: "agence" | "entreprise",
  row: Record<string, unknown>,
): Promise<string> {
  const { data, error } = await client
    .from(table)
    .upsert(row, { onConflict: "slug" })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`${table} upsert ${row.slug}: ${error?.message ?? "no row"}`);
  }
  return data.id as string;
}

export async function seedFakeClients(
  client: SupabaseClient,
): Promise<{ slugs: string[] }> {
  const ids: Record<string, string> = {};

  for (const agence of AGENCES) {
    const urls = buildLeadUrls(agence.slug, agence.email);
    const id = await upsertLead(client, "agence", {
      email: agence.email,
      statut: "MEETING_BOOKED",
      slug: agence.slug,
      first_name: agence.first_name,
      company: agence.company,
      product_statut: agence.product_statut,
      onboarding_completed_at: agence.onboarding_completed_at,
      dashboard_link: buildDashboardUrl(agence.slug),
      scheduled_at:
        agence.product_statut === "MEETING_BOOKED"
          ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
          : null,
      profile: {
        form: agence.form,
        display: { timeline: DEFAULT_TIMELINE },
      },
      ...urls,
    });
    ids[agence.slug] = id;

    if (agence.paid) {
      const { error } = await client.from("payments").upsert(
        {
          agence_id: id,
          offer_type: "starter_1489_5",
          amount_cents: 148900,
          status: "succeeded",
          stripe_checkout_session_id: `seed_session_${agence.slug}`,
          succeeded_at: new Date().toISOString(),
        },
        { onConflict: "stripe_checkout_session_id" },
      );
      if (error) {
        throw new Error(`payment ${agence.slug}: ${error.message}`);
      }
    }
  }

  for (const entreprise of ENTREPRISES) {
    const urls = buildLeadUrls(entreprise.slug, entreprise.email);
    const id = await upsertLead(client, "entreprise", {
      email: entreprise.email,
      statut: "MEETING_BOOKED",
      slug: entreprise.slug,
      first_name: entreprise.first_name,
      company: entreprise.company,
      product_statut: entreprise.product_statut,
      profile: { form: {} },
      ...urls,
    });
    ids[entreprise.slug] = id;
  }

  const betaId = ids[`${SEED_PREFIX}beta-studio`];
  const gammaId = ids[`${SEED_PREFIX}gamma-dev`];
  const acmeId = ids[`${SEED_PREFIX}acme-corp`];
  const bravoId = ids[`${SEED_PREFIX}bravo-sas`];

  await client.from("matches").delete().eq("calendly_url", "https://calendly.com/seed-bravo");
  await client.from("matches").delete().eq("calendly_url", "https://calendly.com/seed-gamma");

  const { error: proposedError } = await client.from("matches").insert({
    agence_id: betaId,
    entreprise_id: bravoId,
    status: "proposed",
    calendly_url: "https://calendly.com/seed-bravo",
    proposal_sent_at: new Date().toISOString(),
  });
  if (proposedError) {
    throw new Error(`match proposed: ${proposedError.message}`);
  }

  const bookingAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const { error: bookedError } = await client.from("matches").insert({
    agence_id: gammaId,
    entreprise_id: acmeId,
    status: "booked",
    calendly_url: "https://calendly.com/seed-gamma",
    proposal_sent_at: new Date().toISOString(),
    booking_at: bookingAt,
  });
  if (bookedError) {
    throw new Error(`match booked: ${bookedError.message}`);
  }

  return { slugs: Object.keys(ids) };
}

export async function deleteSeedClient(
  client: SupabaseClient,
  category: LeadCategory,
  slug: string,
): Promise<void> {
  if (!isSeedSlug(slug)) {
    throw new Error("Only seed clients can be deleted from the UI");
  }

  const table = category;
  const { data: lead, error: leadError } = await client
    .from(table)
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (leadError) {
    throw new Error(`lead lookup failed: ${leadError.message}`);
  }
  if (!lead) {
    throw new Error("Client not found");
  }

  const leadId = lead.id as string;

  const idColumn = category === "agence" ? "agence_id" : "entreprise_id";

  const { error: appointmentsError } = await client
    .from("appointments")
    .delete()
    .eq(idColumn, leadId);
  if (appointmentsError) {
    throw new Error(`appointments delete failed: ${appointmentsError.message}`);
  }

  if (category === "agence") {
    const { error: clearActiveError } = await client
      .from("agence")
      .update({ active_match_id: null })
      .eq("id", leadId);
    if (clearActiveError) {
      throw new Error(`active_match clear failed: ${clearActiveError.message}`);
    }
  }

  const { error: matchesError } = await client
    .from("matches")
    .delete()
    .eq(idColumn, leadId);
  if (matchesError) {
    throw new Error(`matches delete failed: ${matchesError.message}`);
  }

  if (category === "agence") {
    const { error: paymentsError } = await client
      .from("payments")
      .delete()
      .eq("agence_id", leadId);
    if (paymentsError) {
      throw new Error(`payments delete failed: ${paymentsError.message}`);
    }
  }

  const { error: deleteError } = await client.from(table).delete().eq("id", leadId);
  if (deleteError) {
    throw new Error(`${table} delete failed: ${deleteError.message}`);
  }
}
