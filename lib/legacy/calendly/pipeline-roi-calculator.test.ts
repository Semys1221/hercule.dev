/** Unit tests for pipeline ROI simulator. */

import assert from "node:assert/strict";

import {
  computePipelineRoi,
  formatRoiAssumptionsHint,
} from "@/lib/legacy/calendly/pipeline-roi-calculator";

const defaults = computePipelineRoi({
  roi_call_model: "1_call",
  roi_rdv_per_month: 20,
  roi_meeting_duration: "30min",
  roi_closing_rate: 20,
  roi_basket_eur: 1500,
  pipelineCostMonthly: 1200,
});

assert.equal(defaults.effectiveRdvPerMonth, 20);
assert.equal(defaults.signedPerMonth, 4);
assert.equal(defaults.monthlyRevenue, 6000);
assert.equal(defaults.annualRevenue, 72000);
assert.equal(defaults.roiRatio, 5);

const higherBasket = computePipelineRoi({
  roi_call_model: "1_call",
  roi_rdv_per_month: 20,
  roi_meeting_duration: "30min",
  roi_closing_rate: 20,
  roi_basket_eur: 3000,
  pipelineCostMonthly: 1200,
});

assert.equal(higherBasket.monthlyRevenue, 12000);

const threeCallModel = computePipelineRoi({
  roi_call_model: "3_call",
  roi_rdv_per_month: 20,
  roi_meeting_duration: "30min",
  roi_closing_rate: 20,
  roi_basket_eur: 1500,
  pipelineCostMonthly: 1200,
});

assert.equal(threeCallModel.effectiveRdvPerMonth, 20 / 3);
assert.ok(threeCallModel.monthlyRevenue < defaults.monthlyRevenue);

const oneHourMeetings = computePipelineRoi({
  roi_call_model: "1_call",
  roi_rdv_per_month: 20,
  roi_meeting_duration: "1h",
  roi_closing_rate: 20,
  roi_basket_eur: 1500,
  pipelineCostMonthly: 1200,
});

assert.equal(oneHourMeetings.effectiveRdvPerMonth, 10);
assert.equal(oneHourMeetings.monthlyRevenue, 3000);

assert.equal(
  formatRoiAssumptionsHint(1500, 20),
  "(avec panier 1 500 € et closing 20 %)",
);

console.log("OK lib/calendly/pipeline-roi-calculator.test.ts");
