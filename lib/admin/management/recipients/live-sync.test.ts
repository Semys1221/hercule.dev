import assert from "node:assert/strict";

import { isValidPhaseTransition } from "./transitions";

assert.equal(isValidPhaseTransition("subsequence-interested", "meeting-comptable"), true);
assert.equal(isValidPhaseTransition("meeting-comptable", "onboarding-sequence"), true);
assert.equal(isValidPhaseTransition("subsequence-interested", "onboarding-sequence"), false);
assert.equal(isValidPhaseTransition("onboarding-sequence", "meeting-comptable"), false);

console.log("live-sync.test.ts: ok");
