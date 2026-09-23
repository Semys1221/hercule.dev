/**
 * API smoke: DEC trial checkout draft (no card payment).
 * Requires dev server + Stripe test keys (cs_test_...).
 */
import assert from "node:assert/strict";

import { OFFER_TYPES_COMPTABLE } from "@/lib/commercial/constants";
import {
  DEC_FREE_TRIAL_SOURCE,
  PRODUCT_STATUT_FREE_TRIAL_PENDING,
} from "@/lib/clients/dec-free-trial";
import { CONFERENCE_CLIENT_TYPES } from "@/lib/commercial/conference-pricing";
import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import { getStripeClient } from "@/lib/legacy/payments/stripe";
import { getDecTrialPaymentBySessionId, getDecTrialClientBySlug } from "@/lib/test/e2e/supabase-assertions";

import { applyE2eResendFromEnv } from "./e2eResendEnv";

applyE2eResendFromEnv();

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://127.0.0.1:3000";

async function main(): Promise<void> {
  const { createSmokeRequestContext } = await import("@/lib/test/e2e/http-request");
  const ctx = createSmokeRequestContext(BASE_URL);

  console.log("DEC trial draft smoke starting…", { baseUrl: BASE_URL });

  const response = await ctx.post("/api/payments/checkout-dec-trial", { data: {} });
  const body = (await response.json()) as {
    clientSecret?: string;
    sessionId?: string;
    slug?: string;
    error?: string;
  };

  assert.equal(response.status(), 200, body.error ?? "checkout-dec-trial failed");
  assert.ok(body.clientSecret, "missing clientSecret");
  assert.ok(body.sessionId, "missing sessionId");
  assert.ok(body.slug, "missing slug");
  assert.match(body.sessionId!, /^cs_test_/, "expected Stripe test session (cs_test_); check STRIPE_SECRET_KEY");

  const slug = body.slug!;
  const sessionId = body.sessionId!;

  const clientRow = await getDecTrialClientBySlug(slug);
  assert.equal(clientRow.client_type, CONFERENCE_CLIENT_TYPES.dec);
  assert.equal(clientRow.offer_type, OFFER_TYPES_COMPTABLE.monthly1499Trial);
  assert.equal(clientRow.product_statut, PRODUCT_STATUT_FREE_TRIAL_PENDING);
  assert.match(clientRow.email, /^pending\+.+\@checkout\.hercule\.dev$/);

  const paymentRow = await getDecTrialPaymentBySessionId(sessionId);
  assert.equal(paymentRow.client_id, clientRow.id);
  assert.equal(paymentRow.status, "pending");

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  assert.equal(session.metadata?.source, DEC_FREE_TRIAL_SOURCE);
  assert.equal(session.metadata?.product, "free_trial");
  assert.equal(session.metadata?.offer_type, OFFER_TYPES_COMPTABLE.monthly1499Trial);
  assert.equal(session.metadata?.slug, slug);
  assert.equal(session.metadata?.client_id, clientRow.id);
  assert.equal(session.metadata?.payment_id, paymentRow.id);
  assert.equal(session.locale, "fr");
  assert.equal(session.ui_mode, "embedded_page");
  assert.ok(
    session.return_url?.includes(`/clients/${slug}`) && session.return_url?.includes("paid=1"),
    `unexpected return_url: ${session.return_url}`,
  );

  const linkClient = createLinkTrackingClient();
  const { count } = await linkClient
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("slug", slug);
  assert.equal(count, 1);

  console.log("DEC trial draft smoke passed", { slug, sessionId });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
