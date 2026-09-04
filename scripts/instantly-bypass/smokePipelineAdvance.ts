import assert from "node:assert/strict";

import { isDue, RULES } from "@/lib/instantly-bypass/pipeline-advance";

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

function main() {
  testIsDue24h();
  testIsDue48h();
  testRulesDelays();
  console.log("All pipeline advance smoke tests passed.");
}

main();
