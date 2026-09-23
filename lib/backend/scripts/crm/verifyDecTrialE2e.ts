/**
 * Post-payment verifier for DEC trial checkout (local test or prod).
 * Usage:
 *   tsx --env-file=.env ./lib/backend/scripts/crm/verifyDecTrialE2e.ts --session=cs_test_xxx [--sync] [--base-url=http://127.0.0.1:3000] [--cleanup]
 */
import assert from "node:assert/strict";

import { OFFER_TYPES_COMPTABLE } from "@/lib/commercial/constants";
import { DEC_FREE_TRIAL_SOURCE, PRODUCT_STATUT_FREE_TRIAL_PENDING } from "@/lib/clients/dec-free-trial";
import { CONFERENCE_CLIENT_TYPES } from "@/lib/commercial/conference-pricing";
import { deleteConferenceClient } from "@/lib/clients/delete-client";
import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import { getStripeClient } from "@/lib/legacy/payments/stripe";
import {
  getDecTrialClientBySlug,
  pollClientPaymentSucceeded,
  pollDecTrialStartedEmailJob,
} from "@/lib/test/e2e/supabase-assertions";

import { applyE2eResendFromEnv } from "./e2eResendEnv";

applyE2eResendFromEnv();

type CliArgs = {
  sessionId: string;
  baseUrl: string;
  sync: boolean;
  cleanup: boolean;
};

function parseArgs(argv: string[]): CliArgs {
  let sessionId = "";
  let baseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://127.0.0.1:3000";
  let sync = false;
  let cleanup = false;

  for (const arg of argv) {
    if (arg.startsWith("--session=")) {
      sessionId = arg.slice("--session=".length).trim();
    } else if (arg.startsWith("--base-url=")) {
      baseUrl = arg.slice("--base-url=".length).trim().replace(/\/$/, "");
    } else if (arg === "--sync") {
      sync = true;
    } else if (arg === "--cleanup") {
      cleanup = true;
    }
  }

  if (!sessionId) {
    throw new Error("Missing --session=cs_test_... or cs_live_...");
  }

  return { sessionId, baseUrl, sync, cleanup };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const stripe = getStripeClient();

  console.log("verify DEC trial E2E", args);

  let session = await stripe.checkout.sessions.retrieve(args.sessionId, {
    expand: ["subscription"],
  });

  if (session.status !== "complete") {
    throw new Error(`Checkout session not complete: status=${session.status}`);
  }

  assert.ok(
    session.payment_status === "paid" || session.payment_status === "no_payment_required",
    `unexpected payment_status: ${session.payment_status}`,
  );

  const metadata = session.metadata ?? {};
  assert.equal(metadata.source, DEC_FREE_TRIAL_SOURCE);
  assert.equal(metadata.product, "free_trial");
  assert.equal(metadata.offer_type, OFFER_TYPES_COMPTABLE.monthly1499Trial);

  const slug = metadata.slug?.trim();
  const clientId = metadata.client_id?.trim();
  const paymentId = metadata.payment_id?.trim();
  assert.ok(slug && clientId && paymentId, "missing metadata slug/client_id/payment_id");

  assert.ok(
    session.return_url?.includes(`/clients/${slug}`) && session.return_url?.includes("paid=1"),
    `unexpected return_url: ${session.return_url}`,
  );

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;
  assert.ok(subscriptionId, "missing subscription on completed session");

  if (args.sync) {
    const syncResponse = await fetch(`${args.baseUrl}/api/payments/sync-conference-checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: args.sessionId }),
    });
    const syncBody = (await syncResponse.json()) as { synced?: boolean; reason?: string };
    console.log("sync result", syncBody);
    if (!syncBody.synced && syncBody.reason !== "not_paid_yet") {
      assert.equal(syncResponse.status, 200);
    }
  }

  await pollClientPaymentSucceeded(clientId, 45_000);

  const clientRow = await getDecTrialClientBySlug(slug);
  assert.equal(clientRow.id, clientId);
  assert.equal(clientRow.client_type, CONFERENCE_CLIENT_TYPES.dec);
  assert.equal(clientRow.offer_type, OFFER_TYPES_COMPTABLE.monthly1499Trial);
  assert.equal(clientRow.product_statut, PRODUCT_STATUT_FREE_TRIAL_PENDING);
  assert.ok(!clientRow.email.startsWith("pending+"), `email still placeholder: ${clientRow.email}`);
  assert.ok(clientRow.stripe_customer_id, "missing stripe_customer_id");
  assert.ok(clientRow.stripe_subscription_id, "missing stripe_subscription_id");

  const supabase = createLinkTrackingClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("id, status, stripe_checkout_session_id, succeeded_at")
    .eq("id", paymentId)
    .maybeSingle();
  assert.equal(payment?.status, "succeeded");
  assert.equal(payment?.stripe_checkout_session_id, args.sessionId);
  assert.ok(payment?.succeeded_at, "missing succeeded_at");

  const emailJob = await pollDecTrialStartedEmailJob(clientId, 30_000);
  assert.ok(emailJob.idempotency_key.includes(args.sessionId));

  const dashboardResponse = await fetch(`${args.baseUrl}/api/clients/${encodeURIComponent(slug)}`);
  const dashboardBody = (await dashboardResponse.json()) as {
    clientMode?: string;
    onboardingVariant?: string;
    isPaid?: boolean;
    error?: string;
  };
  assert.equal(dashboardResponse.status, 200, dashboardBody.error);
  assert.equal(dashboardBody.isPaid, true);
  assert.equal(dashboardBody.clientMode, "client_onboarding");
  assert.equal(dashboardBody.onboardingVariant, "dec_free_trial");

  const subscription =
    typeof session.subscription === "object" && session.subscription
      ? session.subscription
      : await stripe.subscriptions.retrieve(subscriptionId);
  if (subscription.trial_end) {
    const days = (subscription.trial_end - Math.floor(Date.now() / 1000)) / 86_400;
    assert.ok(days >= 10 && days <= 16, `unexpected trial length (~14d): ${days.toFixed(1)} days left`);
  }

  const summary = {
    ok: true,
    sessionId: args.sessionId,
    slug,
    clientId,
    paymentId,
    email: clientRow.email,
    emailJob,
    subscriptionId,
  };
  console.log(JSON.stringify(summary, null, 2));

  if (args.cleanup) {
    await deleteConferenceClient({ supabase, clientId });
    console.log("cleaned up test client", { clientId, slug });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
