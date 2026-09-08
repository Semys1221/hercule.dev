/** Unit tests for pricing loader. */

import assert from "node:assert/strict";

import { getPricingDocument, getPricingPlans, resolvePricingForComponent } from "@/lib/site/pricing-data";

const plans = getPricingPlans("agence");
assert.equal(plans.length, 2);
assert.equal(plans[0].id, "plan-starter");
assert.match(plans[0].price, /1 489/);
assert.match(plans[1].summary ?? "", /vitrine/i);
assert.match(plans[1].footer ?? "", /souscription/i);

const comptablePlans = getPricingPlans("comptable");
assert.equal(comptablePlans.length, 3);
assert.equal(comptablePlans[0].id, "plan-comptable-croissance");
assert.match(comptablePlans[0].price, /1 499/);
assert.equal(comptablePlans[2].id, "plan-comptable-starter");
assert.match(comptablePlans[2].price, /999/);

const document = getPricingDocument("agence");
assert.ok(document);
assert.ok(document.guaranteeSection.items.length >= 3);

const filtered = resolvePricingForComponent("agence", {
  id: "pricing_inst_test",
  hiddenPlanIds: ["plan-recurrent"],
});
assert.equal(filtered.length, 1);
assert.equal(filtered[0].id, "plan-starter");

console.log("pricing.test.ts: ok");
