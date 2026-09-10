/** Unit tests for comptable sales copy (signals, differentiators, ticket). */

import assert from "node:assert/strict";

import { COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";

import {
  COMPTABLE_DIFFERENTIATOR_OPTIONS,
  COMPTABLE_ENTERPRISES_MONITORED_LABEL,
  COMPTABLE_PRESENTATION_PARAGRAPHS,
  COMPTABLE_SIGNALS,
  COMPTABLE_TYPICAL_MONTHLY_HONORAIRES_CENTS,
  formatComptableTypicalMonthlyHonoraires,
} from "./comptable-sales-copy";

function main() {
  assert.equal(COMPTABLE_SIGNALS.length, 5);
  assert.equal(COMPTABLE_ENTERPRISES_MONITORED_LABEL, "4 M+");
  assert.equal(
    COMPTABLE_TYPICAL_MONTHLY_HONORAIRES_CENTS,
    COMMERCIAL_COMPTABLE.mrrPerSignedMissionCents,
  );
  assert.equal(formatComptableTypicalMonthlyHonoraires(), "300 € / mois");

  const presentation = COMPTABLE_PRESENTATION_PARAGRAPHS.join(" ");
  assert.match(presentation, /Pappers/);
  assert.match(presentation, /Sirene/);
  assert.doesNotMatch(presentation, /Papers[^s]/);
  assert.doesNotMatch(presentation, /site\.gouv/i);
  assert.doesNotMatch(presentation, /recrutement massif/i);

  assert.equal(COMPTABLE_DIFFERENTIATOR_OPTIONS.length, 7);
  const labels = COMPTABLE_DIFFERENTIATOR_OPTIONS.map((option) => option.label).join(" ");
  assert.doesNotMatch(labels, /moins cher/i);

  console.log("OK lib/admin/funnels/comptable-sales-copy.test.ts");
}

main();
