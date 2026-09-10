/** Unit tests for comptable pricing layout helpers. */

import assert from "node:assert/strict";

import {
  COMPTABLE_PLAN_IDS,
  COMPTABLE_PRICING_CTA,
  comptableOfferLabel,
  getComptablePricingPlans,
  offerTypeForPlan,
} from "@/lib/commercial/comptable-pricing";
import { OFFER_TYPES_COMPTABLE } from "@/lib/commercial/constants";

const { lite, starter, pack3 } = getComptablePricingPlans();

assert.equal(lite.id, COMPTABLE_PLAN_IDS.lite);
assert.equal(lite.name, "Hercule Lite");
assert.equal(offerTypeForPlan(lite), OFFER_TYPES_COMPTABLE.starter999_5);

assert.equal(starter.id, COMPTABLE_PLAN_IDS.starter);
assert.equal(starter.name, "Hercule Starter");
assert.equal(starter.featured, true);
assert.equal(offerTypeForPlan(starter), OFFER_TYPES_COMPTABLE.monthly1499);

assert.equal(pack3.id, COMPTABLE_PLAN_IDS.pack3);
assert.equal(pack3.name, "Pack 3 mois Starter");
assert.equal(offerTypeForPlan(pack3), OFFER_TYPES_COMPTABLE.pack3x1499);

assert.match(COMPTABLE_PRICING_CTA, /Activer & Sécuriser mon calendrier/i);
assert.match(comptableOfferLabel(OFFER_TYPES_COMPTABLE.starter999_5), /998/);
assert.match(comptableOfferLabel(OFFER_TYPES_COMPTABLE.monthly1499), /Starter/);
assert.match(comptableOfferLabel(OFFER_TYPES_COMPTABLE.pack3x1499), /Pack 3 mois/i);

console.log("comptable-pricing.test.ts: ok");
