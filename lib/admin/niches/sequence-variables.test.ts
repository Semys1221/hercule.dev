/** Unit tests for sequence variable validation. */

import assert from "node:assert/strict";

import { catalogVariablesForNiche } from "@/lib/email-variables/catalog";
import {
  enabledKeysFromTokens,
  validateSequenceCopy,
} from "@/lib/admin/niches/sequence-variables";

const agenceTokens = catalogVariablesForNiche("agence");
assert.ok(agenceTokens.includes("{{firstNameLine}}"));

const enabled = enabledKeysFromTokens(agenceTokens);
assert.ok(enabled.has("firstNameLine"));

const valid = validateSequenceCopy(agenceTokens, [
  { subject: "Hello", body: "Link {{confirmation_agence_link}}" },
]);
assert.equal(valid.ok, true);

const invalid = validateSequenceCopy(agenceTokens, [
  { subject: "Bad", body: "{{unknown_var}}" },
]);
assert.equal(invalid.ok, false);
if (!invalid.ok) {
  assert.deepEqual(invalid.unknown, ["unknown_var"]);
}

console.log("sequence-variables.test.ts: ok");
