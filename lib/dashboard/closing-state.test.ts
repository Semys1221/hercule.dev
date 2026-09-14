/** Unit tests for dashboard closing state parsing. */
import assert from "node:assert/strict";

import {
  emptyDashboardClosingState,
  mergeDashboardClosing,
  normalizeRecoveryCycle,
  parseDashboardClosing,
} from "./closing-state";

assert.equal(normalizeRecoveryCycle(-1), 0);
assert.equal(normalizeRecoveryCycle(0), 0);
assert.equal(normalizeRecoveryCycle(1), 1);
assert.equal(normalizeRecoveryCycle(2), 2);
assert.equal(normalizeRecoveryCycle(5), 2);
assert.equal(normalizeRecoveryCycle("x"), 0);

const empty = emptyDashboardClosingState();
assert.equal(empty.recoveryCycle, 0);
assert.equal(empty.finalCommitAccepted, false);

const merged = mergeDashboardClosing(empty, {
  recoveryCycle: 2,
  finalCommitAccepted: true,
});
assert.equal(merged.recoveryCycle, 2);
assert.equal(merged.finalCommitAccepted, true);
assert.equal(merged.recoveryCompleted, true);

const parsed = parseDashboardClosing({
  recoveryCycle: 1,
  commit: "hesitate",
});
assert.equal(parsed.recoveryCycle, 1);
assert.equal(parsed.commit, "hesitate");

console.log("closing-state.test.ts: ok");
