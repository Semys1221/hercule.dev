/**
 * Backfill Pierre Meniaud conference client dashboard — NO emails sent.
 *
 * - Stripe customer + subscription lookup by email
 * - Anchor payment (17 Sept 2026)
 * - Onboarding CGV + expired retraction + delivery schedule
 *
 * Usage: pnpm provision-meniaud-dashboard
 */

import {
  CONFERENCE_PRICING_AMOUNTS,
  rdvCountForOffer,
} from "@/lib/commercial/conference-pricing";
import { CLIENT_CGV_VERSION } from "@/lib/clients/cgv-onboarding";
import { createClientsClient, findClientBySlug } from "@/lib/clients/supabase";
import { syncProfileRetraction } from "@/lib/legacy/retraction/profile-sync";
import { getStripeClient } from "@/lib/legacy/payments/stripe";

const MENIAUD_CLIENT_ID = "b0ebed15-154c-441f-9e7d-3d842bc187cc";
const MENIAUD_SLUG = "QxzohL";
const MENIAUD_EMAIL = "pmeniaud@jum-advisory.com";
const OFFER_TYPE = "conference_dec_monthly";

const PAYMENT_AT = "2026-09-17T10:00:00.000Z";
const ONBOARDING_COMPLETED_AT = "2026-09-22T12:00:00.000Z";
const RETRACTION_ENDS_AT = "2026-09-26T12:00:00.000Z";
const FIRST_LEAD_AT = "2026-10-08T00:00:00.000Z";
const PROVISION_STRIPE_EVENT_ID = "provision_meniaud_dashboard_v1";

async function resolveStripeSubscription(email: string) {
  const stripe = getStripeClient();
  const customers = await stripe.customers.list({ email, limit: 5 });

  if (customers.data.length === 0) {
    throw new Error(`No Stripe customer found for ${email}`);
  }
  if (customers.data.length > 1) {
    throw new Error(
      `Multiple Stripe customers for ${email} — resolve manually (${customers.data.length} matches)`,
    );
  }

  const customer = customers.data[0];
  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: "all",
    limit: 20,
  });

  const active = subscriptions.data.filter(
    (sub) => sub.status === "active" || sub.status === "trialing",
  );

  if (active.length === 0) {
    throw new Error(`No active Stripe subscription for customer ${customer.id}`);
  }
  if (active.length > 1) {
    throw new Error(
      `Multiple active subscriptions for ${email} — resolve manually`,
    );
  }

  return {
    customerId: customer.id,
    subscriptionId: active[0].id,
  };
}

function buildMeniaudProfile(): Record<string, unknown> {
  const profile = syncProfileRetraction({}, "expired");
  profile.cgv_accepted_version = CLIENT_CGV_VERSION;
  profile.cgv_accepted_at = ONBOARDING_COMPLETED_AT;
  profile.full_name = "Pierre Meniaud";
  return profile;
}

async function ensureSucceededPayment(
  client: ReturnType<typeof createClientsClient>,
  subscriptionId: string,
) {
  const { data: existing, error: existingError } = await client
    .from("payments")
    .select("id, succeeded_at")
    .eq("client_id", MENIAUD_CLIENT_ID)
    .eq("status", "succeeded")
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Payment lookup failed: ${existingError.message}`);
  }

  if (existing) {
    console.log(
      `Payment already exists (${existing.id}) — succeeded_at=${existing.succeeded_at}`,
    );
    return existing.id as string;
  }

  const basePayment = {
    client_id: MENIAUD_CLIENT_ID,
    offer_type: OFFER_TYPE,
    amount_cents: CONFERENCE_PRICING_AMOUNTS.decMonthlyCents,
    status: "succeeded",
    succeeded_at: PAYMENT_AT,
    stripe_event_id: PROVISION_STRIPE_EVENT_ID,
  };

  let inserted: { id: string } | null = null;
  let insertError: { message: string } | null = null;

  const withSubscription = {
    ...basePayment,
    stripe_subscription_id: subscriptionId,
  };
  const firstAttempt = await client
    .from("payments")
    .insert(withSubscription)
    .select("id")
    .single();

  if (firstAttempt.error?.message.includes("stripe_subscription_id")) {
    console.warn("payments.stripe_subscription_id missing — inserting without it");
    const fallbackAttempt = await client
      .from("payments")
      .insert(basePayment)
      .select("id")
      .single();
    inserted = fallbackAttempt.data;
    insertError = fallbackAttempt.error;
  } else {
    inserted = firstAttempt.data;
    insertError = firstAttempt.error;
  }

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? "Failed to insert payment");
  }

  console.log(`Payment inserted: ${inserted.id}`);
  return inserted.id as string;
}

async function backfillClientRow(
  client: ReturnType<typeof createClientsClient>,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
) {
  const basePatch: Record<string, unknown> = {
    first_name: "Pierre",
    onboarding_completed_at: ONBOARDING_COMPLETED_AT,
    product_statut: "IN_DELIVERANCE",
    retraction_status: "expired",
    retraction_ends_at: RETRACTION_ENDS_AT,
    retraction_waived_at: null,
    rdv_total: rdvCountForOffer(OFFER_TYPE),
    rdv_used: 0,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    profile: buildMeniaudProfile(),
  };

  const withFirstLeadAt = { ...basePatch, first_lead_at: FIRST_LEAD_AT };

  let updateError = (
    await client.from("clients").update(withFirstLeadAt).eq("id", MENIAUD_CLIENT_ID)
  ).error;

  if (updateError?.message.includes("first_lead_at")) {
    console.warn("first_lead_at column missing — updating without it");
    updateError = (
      await client.from("clients").update(basePatch).eq("id", MENIAUD_CLIENT_ID)
    ).error;
  }

  if (updateError) {
    throw new Error(`Client update failed: ${updateError.message}`);
  }

  console.log("Client row updated (onboarding + retraction expired + delivery schedule)");
}

async function main() {
  const client = createClientsClient();

  const row = await findClientBySlug(client, MENIAUD_SLUG);
  if (!row) {
    throw new Error(`Client slug ${MENIAUD_SLUG} not found`);
  }
  if (row.id !== MENIAUD_CLIENT_ID) {
    throw new Error(
      `Slug ${MENIAUD_SLUG} maps to ${row.id}, expected ${MENIAUD_CLIENT_ID}`,
    );
  }
  if (row.email.trim().toLowerCase() !== MENIAUD_EMAIL) {
    throw new Error(
      `Client email mismatch: ${row.email} (expected ${MENIAUD_EMAIL})`,
    );
  }

  const { customerId, subscriptionId } = await resolveStripeSubscription(MENIAUD_EMAIL);
  console.log(`Stripe customer: ${customerId}`);
  console.log(`Stripe subscription: ${subscriptionId}`);

  await ensureSucceededPayment(client, subscriptionId);
  await backfillClientRow(client, customerId, subscriptionId);

  const refreshed = await findClientBySlug(client, MENIAUD_SLUG);
  console.log("\n--- Meniaud dashboard provisioned ---");
  console.log(`  URL: /clients/${MENIAUD_SLUG}`);
  console.log(`  first_name: ${refreshed?.first_name}`);
  console.log(`  product_statut: ${refreshed?.product_statut}`);
  console.log(`  retraction_status: ${refreshed?.retraction_status}`);
  console.log(`  onboarding_completed_at: ${refreshed?.onboarding_completed_at}`);
  console.log(`  first_lead_at: ${refreshed?.first_lead_at ?? "(column absent)"}`);
  console.log(`  rdv: ${refreshed?.rdv_used}/${refreshed?.rdv_total}`);
  console.log("\n10th RDV ~ 6 Nov 2026 (1st window 8–12 Oct, then +3d cadence)");
  console.log("No emails sent.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
