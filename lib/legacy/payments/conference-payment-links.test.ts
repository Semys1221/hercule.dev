/** Unit tests for conference Payment Link mapping. */

import assert from "node:assert/strict";

import {
  billingForConferenceOffer,
  clientTypeForConferenceOffer,
  OFFER_TYPES_CONFERENCE,
} from "@/lib/commercial/conference-pricing";
import {
  CONFERENCE_PAYMENT_LINK_URLS,
  conferencePaymentLinkReturnUrl,
  isConferencePaymentLinkSession,
  paymentLinkUrlForConferenceOffer,
} from "@/lib/legacy/payments/conference-payment-links";

assert.equal(
  CONFERENCE_PAYMENT_LINK_URLS[OFFER_TYPES_CONFERENCE.decMonthly],
  "https://buy.stripe.com/9B6aEW0G91mR4DdgAE3Je0o",
);
assert.equal(
  CONFERENCE_PAYMENT_LINK_URLS[OFFER_TYPES_CONFERENCE.decPack],
  "https://buy.stripe.com/eVq4gy74x4z39Xxacg3Je0p",
);
assert.equal(
  CONFERENCE_PAYMENT_LINK_URLS[OFFER_TYPES_CONFERENCE.cifMonthly],
  "https://buy.stripe.com/14A3cubkN3uZ3z9fwA3Je0q",
);
assert.equal(
  CONFERENCE_PAYMENT_LINK_URLS[OFFER_TYPES_CONFERENCE.cifPack],
  "https://buy.stripe.com/6oUbJ09cF4z3edNcko3Je0r",
);
assert.equal(
  CONFERENCE_PAYMENT_LINK_URLS[OFFER_TYPES_CONFERENCE.iasMonthly],
  "https://buy.stripe.com/00w8wObkNc1v7Ppbgk3Je0s",
);
assert.equal(
  CONFERENCE_PAYMENT_LINK_URLS[OFFER_TYPES_CONFERENCE.iasPack],
  "https://buy.stripe.com/00w7sKewZaXr9Xxesw3Je0t",
);
assert.equal(
  new Set(Object.values(CONFERENCE_PAYMENT_LINK_URLS)).size,
  Object.values(OFFER_TYPES_CONFERENCE).length,
);

const paymentId = "3f1c2a4e-9b7d-4c1a-8e2f-0a1b2c3d4e5f";
assert.equal(
  paymentLinkUrlForConferenceOffer(OFFER_TYPES_CONFERENCE.iasPack, paymentId),
  `https://buy.stripe.com/00w7sKewZaXr9Xxesw3Je0t?client_reference_id=${paymentId}`,
);

assert.equal(
  conferencePaymentLinkReturnUrl("https://www.hercule.dev"),
  "https://www.hercule.dev/api/payments/conference-return?session_id={CHECKOUT_SESSION_ID}",
);

assert.ok(isConferencePaymentLinkSession({ metadata: { product: "conference_personal" } }));
assert.ok(!isConferencePaymentLinkSession({ metadata: { product: "comptable_acquisition_1489" } }));
assert.ok(!isConferencePaymentLinkSession({ metadata: null }));

assert.equal(clientTypeForConferenceOffer(OFFER_TYPES_CONFERENCE.decPack), "dec");
assert.equal(clientTypeForConferenceOffer(OFFER_TYPES_CONFERENCE.cifMonthly), "cif");
assert.equal(clientTypeForConferenceOffer(OFFER_TYPES_CONFERENCE.iasPack), "ias");
assert.equal(billingForConferenceOffer(OFFER_TYPES_CONFERENCE.decMonthly), "monthly");
assert.equal(billingForConferenceOffer(OFFER_TYPES_CONFERENCE.cifPack), "pack");

console.log("OK lib/legacy/payments/conference-payment-links.test.ts");
