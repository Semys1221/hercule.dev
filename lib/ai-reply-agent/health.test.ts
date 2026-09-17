import assert from "node:assert/strict";

import { hashKnowledgePack } from "./knowledge";

assert.equal(hashKnowledgePack("test-pack").length, 16);
assert.notEqual(hashKnowledgePack("a"), hashKnowledgePack("b"));

console.log("health.test.ts: ok");
