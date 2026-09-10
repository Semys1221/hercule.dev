import assert from "node:assert/strict";

import {
  amountCentsForComptableOffer,
  comptableCheckoutMode,
  isComptableSubscriptionOffer,
  stripeCheckoutModeForComptablePrice,
} from "@/lib/payments/comptable-offers";
import { COMMERCIAL_COMPTABLE, OFFER_TYPES_COMPTABLE } from "@/lib/commercial/constants";

assert.equal(
  comptableCheckoutMode(OFFER_TYPES_COMPTABLE.starter999_5),
  "subscription",
);
assert.equal(
  comptableCheckoutMode(OFFER_TYPES_COMPTABLE.monthly1499),
  "subscription",
);
assert.equal(comptableCheckoutMode(OFFER_TYPES_COMPTABLE.pack3x1499), "payment");

assert.equal(stripeCheckoutModeForComptablePrice({ type: "recurring" }), "subscription");
assert.equal(stripeCheckoutModeForComptablePrice({ type: "one_time" }), "payment");

assert.equal(isComptableSubscriptionOffer(OFFER_TYPES_COMPTABLE.starter999_5), true);
assert.equal(isComptableSubscriptionOffer(OFFER_TYPES_COMPTABLE.pack3x1499), false);

assert.equal(
  amountCentsForComptableOffer(OFFER_TYPES_COMPTABLE.starter999_5),
  COMMERCIAL_COMPTABLE.starterPriceCents,
);
assert.equal(
  amountCentsForComptableOffer(OFFER_TYPES_COMPTABLE.monthly1499),
  COMMERCIAL_COMPTABLE.growthMonthlyPriceCents,
);
assert.equal(
  amountCentsForComptableOffer(OFFER_TYPES_COMPTABLE.pack3x1499),
  COMMERCIAL_COMPTABLE.pack3TotalCents,
);

console.log("comptable-offers.test.ts: ok");
