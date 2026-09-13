import assert from "node:assert/strict";

import { getSalesTestSessionPreset } from "./sales-test-session-preset";

assert.equal(getSalesTestSessionPreset("agence").leadCategory, "agence");
assert.equal(getSalesTestSessionPreset("comptable").leadCategory, "comptable");
assert.equal(getSalesTestSessionPreset("entreprise").leadCategory, "entreprise");
assert.equal(getSalesTestSessionPreset("entreprise").slug, "seed-sales-session-entreprise");

console.log("sales-test-session-preset.test.ts: ok");
