/**
 * Apply Meniaud dashboard backfill using Stripe MCP–resolved IDs.
 *
 * Resolve Stripe data via plugin-stripe-stripe (live Hercule account):
 *   list_available_accounts_or_orgs → stripe_context acct_1SzaZsBd01AMeiaQ
 *   GetCustomersSearch query email:'pmeniaud@jum-advisory.com'
 *   GetSubscriptionsSubscriptionExposedId id sub_...
 *   GetInvoicesInvoice id in_... (paid_at, amount_paid)
 *
 * Usage: pnpm apply-meniaud-dashboard
 */

import { spawnSync } from "node:child_process";

import { rdvCountForOffer } from "@/lib/commercial/conference-pricing";
import { CLIENT_CGV_VERSION } from "@/lib/clients/cgv-onboarding";
import { createClientsClient, findClientBySlug } from "@/lib/clients/supabase";
import { syncProfileRetraction } from "@/lib/legacy/retraction/profile-sync";

/** Stripe MCP lookup (acct_1SzaZsBd01AMeiaQ, livemode true) — 2026-09-22 */
const STRIPE_MCP = {
  customerId: "cus_VGoSd1PtiEIDus",
  subscriptionId: "sub_1UGGq5Bd01AMeiaQ7bZKykwS",
  invoiceId: "in_1UGGpVBd01AMeiaQX3rN8j3M",
  offerType: "comptable_acquisition_1489_1m",
  amountCents: 148_900,
  paidAt: "2026-09-16T11:17:16.000Z",
  customerName: "Pierre",
};

const MENIAUD_CLIENT_ID = "b0ebed15-154c-441f-9e7d-3d842bc187cc";
const MENIAUD_SLUG = "QxzohL";
const MENIAUD_EMAIL = "pmeniaud@jum-advisory.com";

const ONBOARDING_COMPLETED_AT = "2026-09-17T08:44:13.928Z";
const FIRST_LEAD_AT = "2026-10-07T08:44:13.928Z";
const PROVISION_STRIPE_EVENT_ID = "provision_meniaud_dashboard_v1";

function buildMeniaudProfile(): Record<string, unknown> {
  const profile = syncProfileRetraction({}, "waived");
  profile.cgv_accepted_version = CLIENT_CGV_VERSION;
  profile.cgv_accepted_at = ONBOARDING_COMPLETED_AT;
  profile.full_name = "Pierre Meniaud";
  return profile;
}

function runMigrations(): void {
  const result = spawnSync("pnpm", ["apply-meniaud-dashboard-migrations"], {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  if (result.status !== 0) {
    throw new Error("Migration step failed");
  }
}

async function ensureSucceededPayment(
  client: ReturnType<typeof createClientsClient>,
) {
  const { data: existing, error: existingError } = await client
    .from("payments")
    .select("id, succeeded_at, stripe_subscription_id")
    .eq("client_id", MENIAUD_CLIENT_ID)
    .eq("status", "succeeded")
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Payment lookup failed: ${existingError.message}`);
  }

  if (existing) {
    const patch: Record<string, unknown> = {
      offer_type: STRIPE_MCP.offerType,
      amount_cents: STRIPE_MCP.amountCents,
      succeeded_at: STRIPE_MCP.paidAt,
      stripe_subscription_id: STRIPE_MCP.subscriptionId,
    };

    const { error: updateError } = await client
      .from("payments")
      .update(patch)
      .eq("id", existing.id);

    if (updateError?.message.includes("stripe_subscription_id")) {
      const { error: fallbackError } = await client
        .from("payments")
        .update({
          offer_type: STRIPE_MCP.offerType,
          amount_cents: STRIPE_MCP.amountCents,
          succeeded_at: STRIPE_MCP.paidAt,
        })
        .eq("id", existing.id);
      if (fallbackError) {
        throw new Error(`Payment update failed: ${fallbackError.message}`);
      }
    } else if (updateError) {
      throw new Error(`Payment update failed: ${updateError.message}`);
    }

    console.log(`Payment synced from Stripe MCP (${existing.id})`);
    return existing.id as string;
  }

  const { data: inserted, error: insertError } = await client
    .from("payments")
    .insert({
      client_id: MENIAUD_CLIENT_ID,
      offer_type: STRIPE_MCP.offerType,
      amount_cents: STRIPE_MCP.amountCents,
      status: "succeeded",
      succeeded_at: STRIPE_MCP.paidAt,
      stripe_subscription_id: STRIPE_MCP.subscriptionId,
      stripe_event_id: PROVISION_STRIPE_EVENT_ID,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? "Failed to insert payment");
  }

  console.log(`Payment inserted from Stripe MCP: ${inserted.id}`);
  return inserted.id as string;
}

async function backfillClientRow(client: ReturnType<typeof createClientsClient>) {
  const rdvTotal =
    STRIPE_MCP.offerType === "conference_dec_monthly"
      ? rdvCountForOffer("conference_dec_monthly")
      : 10;

  const patch: Record<string, unknown> = {
    first_name: STRIPE_MCP.customerName,
    email: MENIAUD_EMAIL,
    offer_type: STRIPE_MCP.offerType,
    billing: "monthly",
    onboarding_completed_at: ONBOARDING_COMPLETED_AT,
    product_statut: "IN_DELIVERANCE",
    retraction_status: "waived",
    retraction_ends_at: null,
    retraction_waived_at: ONBOARDING_COMPLETED_AT,
    rdv_total: rdvTotal,
    rdv_used: 0,
    first_lead_at: FIRST_LEAD_AT,
    stripe_customer_id: STRIPE_MCP.customerId,
    stripe_subscription_id: STRIPE_MCP.subscriptionId,
    profile: buildMeniaudProfile(),
  };

  const { error } = await client.from("clients").update(patch).eq("id", MENIAUD_CLIENT_ID);

  if (error) {
    throw new Error(`Client update failed: ${error.message}`);
  }

  console.log("Client row synced from Stripe MCP + onboarding backfill");
}

async function ensureCalendlySeat(
  client: ReturnType<typeof createClientsClient>,
) {
  const { data: existing, error: existingError } = await client
    .from("calendly_seat_onboarding")
    .select("id")
    .eq("client_id", MENIAUD_CLIENT_ID)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Calendly seat lookup failed: ${existingError.message}`);
  }

  const patch = {
    email: MENIAUD_EMAIL,
    status: "active",
    calendly_invitation_status: "accepted",
    started_at: ONBOARDING_COMPLETED_AT,
    welcome_sent_at: ONBOARDING_COMPLETED_AT,
    last_checked_at: ONBOARDING_COMPLETED_AT,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await client
      .from("calendly_seat_onboarding")
      .update(patch)
      .eq("id", existing.id);
    if (error) {
      throw new Error(`Calendly seat update failed: ${error.message}`);
    }
    console.log(`Calendly seat marked active (${existing.id})`);
    return;
  }

  const { error } = await client.from("calendly_seat_onboarding").insert({
    client_id: MENIAUD_CLIENT_ID,
    ...patch,
  });
  if (error) {
    throw new Error(`Calendly seat insert failed: ${error.message}`);
  }
  console.log("Calendly seat inserted as accepted");
}

async function verifyDashboard() {
  const client = createClientsClient();
  const row = await findClientBySlug(client, MENIAUD_SLUG);
  if (!row) {
    throw new Error("Client not found after apply");
  }

  const { loadClientDashboard } = await import("@/lib/clients/load-client-dashboard");
  const data = await loadClientDashboard(client, row);

  console.log("\n--- Meniaud dashboard applied ---");
  console.log(`  URL: /clients/${MENIAUD_SLUG}`);
  console.log(`  Stripe customer: ${STRIPE_MCP.customerId}`);
  console.log(`  Stripe subscription: ${STRIPE_MCP.subscriptionId}`);
  console.log(`  Stripe invoice: ${STRIPE_MCP.invoiceId}`);
  console.log(`  offer_type: ${row.offer_type}`);
  console.log(`  paid_at: ${STRIPE_MCP.paidAt}`);
  console.log(`  amount: ${STRIPE_MCP.amountCents / 100} EUR`);
  console.log(`  clientMode: ${data.clientMode}`);
  console.log(`  first_lead_at: ${row.first_lead_at}`);
  console.log(`  rdv: ${data.rdvUsed}/${data.rdvTotal}`);
  console.log("\nFirst RDV window 7–12 Oct 2026 (20–25 days from 17 Sep)");
  console.log("No emails sent.");
}

async function main() {
  console.log("Step 1/3 — Supabase migrations...");
  runMigrations();

  console.log("\nStep 2/3 — Stripe MCP backfill...");
  const client = createClientsClient();

  const row = await findClientBySlug(client, MENIAUD_SLUG);
  if (!row) {
    throw new Error(`Client slug ${MENIAUD_SLUG} not found`);
  }
  if (row.id !== MENIAUD_CLIENT_ID) {
    throw new Error(`Slug ${MENIAUD_SLUG} maps to ${row.id}, expected ${MENIAUD_CLIENT_ID}`);
  }

  await ensureSucceededPayment(client);
  await backfillClientRow(client);
  await ensureCalendlySeat(client);

  console.log("\nStep 3/3 — Verify dashboard...");
  await verifyDashboard();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
