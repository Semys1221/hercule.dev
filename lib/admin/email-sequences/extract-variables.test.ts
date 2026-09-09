/** Unit tests for template variable extraction. */

import assert from "node:assert/strict";

import {
  extractVariableKeys,
  extractVariablesFromSteps,
} from "@/lib/admin/email-sequences/extract-variables";

assert.deepEqual(extractVariableKeys("Bonjour {{firstNameLine}}"), ["firstNameLine"]);
assert.deepEqual(
  extractVariableKeys("{{date}} à {{heure}} — {{confirmLink}}"),
  ["date", "heure", "confirmLink"],
);

const fromSteps = extractVariablesFromSteps([
  { subject: "RDV {{date}}", body: "Lien : {{confirmation_agence_link}}" },
]);
assert.ok(fromSteps.includes("date"));
assert.ok(fromSteps.includes("confirmation_agence_link"));

console.log("extract-variables.test.ts: ok");
