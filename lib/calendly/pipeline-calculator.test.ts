/** Unit tests for pipeline RDV calculator. */

import assert from "node:assert/strict";

import {
  computePipelineCalculator,
  RDV_PER_SALES_DAY,
} from "@/lib/calendly/pipeline-calculator";

const base = computePipelineCalculator({
  rdvInPipeline: 54,
  prediction30Days: 116,
  basketEur: 1500,
  closingRatePercent: 20,
  capacityDaysPerMonth: 5,
});

assert.equal(base.rdvTreatablePerMonth, 5 * RDV_PER_SALES_DAY);
assert.equal(base.revenuePerRdv, 300);
assert.equal(base.potentialCaOnStock, 54 * 300);
assert.equal(base.monthsToClearStock, 54 / 20);
assert.equal(base.capacityBelowInflux, true);
assert.equal(base.netAccumulationPerMonth, 116 - 20);

const lowCapacity = computePipelineCalculator({
  rdvInPipeline: 8,
  prediction30Days: 10,
  basketEur: 1500,
  closingRatePercent: 25,
  capacityDaysPerMonth: 2,
});

assert.equal(lowCapacity.rdvTreatablePerMonth, 8);
assert.equal(lowCapacity.monthsToClearStock, 1);
assert.equal(lowCapacity.capacityBelowInflux, true);

const zeroCapacity = computePipelineCalculator({
  rdvInPipeline: 10,
  prediction30Days: 5,
  basketEur: 1500,
  closingRatePercent: 20,
  capacityDaysPerMonth: 0,
});

assert.equal(zeroCapacity.monthsToClearStock, null);

console.log("OK lib/calendly/pipeline-calculator.test.ts");
