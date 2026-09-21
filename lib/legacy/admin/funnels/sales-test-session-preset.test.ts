import assert from "node:assert/strict";

import { getSalesTestSessionPreset } from "./sales-test-session-preset";

assert.equal(getSalesTestSessionPreset("agence").leadCategory, "agence");
assert.equal(getSalesTestSessionPreset("comptable").leadCategory, "comptable");

console.log("sales-test-session-preset.test.ts: ok");
