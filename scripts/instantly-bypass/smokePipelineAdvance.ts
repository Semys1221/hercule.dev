import assert from "node:assert/strict";

import {
  consumesAdvanceBudget,
  isDue,
  nextStepAfterFlow,
  RULES,
} from "@/lib/instantly-bypass/pipeline-advance";

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function testIsDue24h() {
  assert.equal(isDue(hoursAgo(25), 24), true);
  assert.equal(isDue(hoursAgo(23), 24), false);
  console.log("OK isDue 24h");
}

function testIsDue48h() {
  assert.equal(isDue(hoursAgo(49), 48), true);
  assert.equal(isDue(hoursFromNow(1), 48), false);
  console.log("OK isDue 48h");
}

function testRulesDelays() {
  assert.equal(RULES[0].delayHours, 24);
  assert.equal(RULES[1].delayHours, 48);
  assert.equal(RULES[2].delayHours, 48);
  assert.equal(RULES[2].action, "close");
  console.log("OK pipeline advance rules");
}

function testSkippedDoesNotStarveBatch() {
  const outcomes = [
    "skipped",
    "skipped",
    "skipped",
    "sent",
    "skipped",
    "closed",
    "replied",
    "queued",
    "failed",
  ] as const;

  let remaining = 3;
  for (const outcome of outcomes) {
    if (remaining <= 0) break;
    if (consumesAdvanceBudget(outcome)) remaining -= 1;
  }

  assert.equal(remaining, 0);
  assert.equal(consumesAdvanceBudget("skipped"), false);
  assert.equal(consumesAdvanceBudget("sent"), true);
  assert.equal(consumesAdvanceBudget("queued"), true);
  assert.equal(consumesAdvanceBudget("closed"), true);
  assert.equal(consumesAdvanceBudget("replied"), true);
  assert.equal(consumesAdvanceBudget("failed"), true);
  console.log("OK skipped outcomes do not starve the action budget");
}

function testAlreadySentAdvancesStep() {
  assert.equal(nextStepAfterFlow("interested_email2"), "step_2");
  assert.equal(nextStepAfterFlow("interested_email3"), "step_3");
  assert.equal(nextStepAfterFlow("interested_email1"), "step_1");
  console.log("OK already-sent next flow maps to the following CRM step");
}

function main() {
  testIsDue24h();
  testIsDue48h();
  testRulesDelays();
  testSkippedDoesNotStarveBatch();
  testAlreadySentAdvancesStep();
  console.log("All pipeline advance smoke tests passed.");
}

main();
