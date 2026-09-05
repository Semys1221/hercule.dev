/** Unit tests for pricing loader. */

import assert from "node:assert/strict";

import { getPricingDocument, getPricingPlans, resolvePricingForComponent } from "@/lib/site/pricing-data";

const plans = getPricingPlans("agence");
assert.equal(plans.length, 2);
assert.equal(plans[0].id, "plan-starter");
assert.match(plans[0].price, /1 489/);

const entreprisePlans = getPricingPlans("entreprise");
assert.equal(entreprisePlans.length, 0);

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
