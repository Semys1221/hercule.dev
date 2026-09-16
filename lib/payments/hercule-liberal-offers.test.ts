/** Unit tests for Hercule Libéral Stripe offer helpers. */

import assert from "node:assert/strict";

import {
  amountCentsForHerculeLiberal,
  HERCULE_LIBERAL_OFFER_TYPE,
  HERCULE_LIBERAL_PRODUCT_NAME,
  HERCULE_LIBERAL_STRIPE_PAYMENT_LINK_URL,
  paymentLinkUrlForHerculeLiberal,
} from "@/lib/payments/hercule-liberal-offers";

assert.equal(HERCULE_LIBERAL_PRODUCT_NAME, "Hercule Libéral");
assert.equal(HERCULE_LIBERAL_OFFER_TYPE, "hercule_liberal_1200_monthly");
assert.equal(amountCentsForHerculeLiberal(), 120_000);
assert.ok(HERCULE_LIBERAL_STRIPE_PAYMENT_LINK_URL.startsWith("https://buy.stripe.com/"));
assert.equal(
  paymentLinkUrlForHerculeLiberal(),
  HERCULE_LIBERAL_STRIPE_PAYMENT_LINK_URL,
);

console.log("OK lib/payments/hercule-liberal-offers.test.ts");
