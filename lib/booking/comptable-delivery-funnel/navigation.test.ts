import assert from "node:assert/strict";

import {
  canAccessCalendlyStep,
  getNextStepId,
  getPrevStepId,
  isPreBookingComplete,
  mergeFunnelState,
} from "./navigation";

assert.equal(getNextStepId("intro", "pre_booking"), "profitability");
assert.equal(getNextStepId("engagement", "pre_booking"), "calendly");
assert.equal(getNextStepId("calendly", "pre_booking"), null);
assert.equal(getNextStepId("confirmation", "post_booking"), "annual_revenue");

assert.equal(getPrevStepId("profitability", "pre_booking"), "intro");
assert.equal(getPrevStepId("annual_revenue", "post_booking"), "confirmation");

const emptyAnswers = {};
assert.equal(isPreBookingComplete(emptyAnswers), false);
assert.equal(canAccessCalendlyStep(emptyAnswers), false);

const fullPre = {
  profitability: "satisfied",
  visibility: "purchases",
  accountant_situation: "satisfied_pilot",
  intention: "improve_profit",
  projection: "pay_self",
  budget: "300_500",
  engagement: "yes_if_fit",
};
assert.equal(isPreBookingComplete(fullPre), true);
assert.equal(canAccessCalendlyStep(fullPre), true);

const merged = mergeFunnelState(
  {
    currentStepId: "visibility",
    phase: "pre_booking",
    answers: { profitability: "satisfied" },
  },
  {
    currentStepId: "accountant_situation",
    phase: "pre_booking",
    answers: { visibility: "purchases" },
  },
);
assert.equal(merged.currentStepId, "accountant_situation");
assert.deepEqual(merged.answers, {
  profitability: "satisfied",
  visibility: "purchases",
});

console.log("OK lib/booking/comptable-delivery-funnel/navigation.test.ts");
