/** Unit tests for pricing loader. */

import assert from "node:assert/strict";

import { getPricingDocument, getPricingPlans, resolvePricingForComponent } from "@/lib/site/pricing-data";

const plans = getPricingPlans("agence");
assert.equal(plans.length, 3);
assert.equal(plans[0].id, "plan-starter");
assert.match(plans[0].price, /998/);
assert.equal(plans[1].id, "plan-growth");
assert.match(plans[1].price, /1 498/);
assert.match(plans[2].summary ?? "", /vitrine/i);
assert.match(plans[2].footer ?? "", /souscription/i);

const comptablePlans = getPricingPlans("comptable");
assert.equal(comptablePlans.length, 3);
assert.equal(comptablePlans[0].id, "plan-comptable-lite");
assert.match(comptablePlans[0].price, /998/);
assert.equal(comptablePlans[1].id, "plan-comptable-starter");
assert.match(comptablePlans[1].price, /1 499/);
assert.equal(comptablePlans[2].id, "plan-comptable-pack3");
assert.match(comptablePlans[2].price, /3 598/);

const document = getPricingDocument("agence");
assert.ok(document);
assert.equal(document.guaranteeSection, null);

const filtered = resolvePricingForComponent("agence", {
  id: "pricing_inst_test",
  hiddenPlanIds: ["plan-recurrent", "plan-growth"],
});
assert.equal(filtered.length, 1);
assert.equal(filtered[0].id, "plan-starter");

console.log("pricing.test.ts: ok");
