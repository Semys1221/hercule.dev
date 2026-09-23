/**
 * Integration: DEC trial webhook handler + email job (requires .env Supabase + Resend sandbox).
 * Run: tsx --env-file=.env ./lib/legacy/payments/stripe-webhook-dec-trial.integration.test.ts
 */
import assert from "node:assert/strict";

import type Stripe from "stripe";

import { deleteConferenceClient } from "@/lib/clients/delete-client";
import { OFFER_TYPES_COMPTABLE } from "@/lib/commercial/constants";
import { DEC_FREE_TRIAL_SOURCE } from "@/lib/clients/dec-free-trial";
import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import { createDecTrialClientDraft } from "@/lib/legacy/payments/dec-trial-client-draft";
import { handleDecFreeTrialCheckoutCompleted } from "@/lib/legacy/payments/stripe-webhook-dec-trial";
import { E2E_TEST_EMAIL } from "@/lib/test/e2e-identity";
import { getDecTrialClientBySlug, getDecTrialEmailJobs } from "@/lib/test/e2e/supabase-assertions";

process.env.BOOKING_RESEND_FROM = process.env.BOOKING_RESEND_FROM ?? "Hercule <onboarding@resend.dev>";
process.env.RESEND_FROM = process.env.RESEND_FROM ?? "Hercule <onboarding@resend.dev>";

function buildCompletedSession(params: {
  sessionId: string;
  clientId: string;
  paymentId: string;
  slug: string;
  customerId: string;
  subscriptionId: string;
  email: string;
}): Stripe.Checkout.Session {
  return {
    id: params.sessionId,
    object: "checkout.session",
    status: "complete",
    payment_status: "no_payment_required",
    mode: "subscription",
    customer: params.customerId,
    subscription: params.subscriptionId,
    metadata: {
      source: DEC_FREE_TRIAL_SOURCE,
      product: "free_trial",
      offer_type: OFFER_TYPES_COMPTABLE.monthly1499Trial,
      client_id: params.clientId,
      payment_id: params.paymentId,
      slug: params.slug,
    },
    customer_details: {
      email: params.email,
    },
  } as Stripe.Checkout.Session;
}

async function main(): Promise<void> {
  const supabase = createLinkTrackingClient();
  const draft = await createDecTrialClientDraft(supabase);
  const sessionId = `cs_test_e2e_dec_trial_${Date.now()}`;
  const customerId = `cus_test_e2e_${Date.now()}`;
  const subscriptionId = `sub_test_e2e_${Date.now()}`;
  const testEmail = E2E_TEST_EMAIL;

  await supabase
    .from("payments")
    .update({ stripe_checkout_session_id: sessionId })
    .eq("id", draft.paymentId);

  const session = buildCompletedSession({
    sessionId,
    clientId: draft.clientId,
    paymentId: draft.paymentId,
    slug: draft.slug,
    customerId,
    subscriptionId,
    email: testEmail,
  });

  const handled = await handleDecFreeTrialCheckoutCompleted(
    supabase,
    session,
    `e2e:${sessionId}`,
  );
  assert.equal(handled, true);

  const { data: payment } = await supabase
    .from("payments")
    .select("status, stripe_subscription_id")
    .eq("id", draft.paymentId)
    .maybeSingle();
  assert.equal(payment?.status, "succeeded");
  assert.equal(payment?.stripe_subscription_id, subscriptionId);

  const clientRow = await getDecTrialClientBySlug(draft.slug);
  assert.equal(clientRow.email.toLowerCase(), testEmail.toLowerCase());
  assert.equal(clientRow.stripe_customer_id, customerId);
  assert.equal(clientRow.stripe_subscription_id, subscriptionId);

  const jobs = await getDecTrialEmailJobs(draft.clientId);
  const welcome = jobs.find((job) => job.idempotency_key === `free-trial-started:client:${sessionId}:1`);
  assert.ok(welcome, `missing welcome job; jobs=${JSON.stringify(jobs)}`);
  assert.equal(welcome.triggered_by, "stripe_payment");
  assert.ok(
    welcome.status === "sent" || welcome.status === "pending",
    `unexpected job status: ${welcome.status}`,
  );

  await deleteConferenceClient({ supabase, clientId: draft.clientId });
  console.log("stripe-webhook-dec-trial integration passed", { slug: draft.slug, sessionId });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
