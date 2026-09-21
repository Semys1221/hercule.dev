/** Unit tests for comptable sales copy (signals, differentiators, ticket). */

import assert from "node:assert/strict";

import { COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";

import {
  COMPTABLE_DIFFERENTIATOR_OPTIONS,
  COMPTABLE_ENTERPRISES_MONITORED_LABEL,
  COMPTABLE_MODEL_HIGHLIGHTS,
  COMPTABLE_NICHE_BENCHMARK,
  COMPTABLE_PERFORMANCE_REPORTING_RULE,
  COMPTABLE_PRESENTATION_PARAGRAPHS,
  COMPTABLE_SIGNALS,
  COMPTABLE_TYPICAL_MONTHLY_HONORAIRES_CENTS,
  formatComptableTypicalMonthlyHonoraires,
  formatFoundationRoiScript,
  FOUNDATION_COMPARISON_ROWS,
  FOUNDATION_DEPLOYMENT_PHASES,
  FOUNDATION_MODEL_HIGHLIGHTS,
  FOUNDATION_PRESENTATION_SCRIPT_PARAGRAPHS,
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
  assert.doesNotMatch(presentation, /10 missions/i);
  assert.doesNotMatch(presentation, /Starter/i);

  assert.equal(FOUNDATION_DEPLOYMENT_PHASES.length, 3);
  assert.equal(FOUNDATION_COMPARISON_ROWS.length, 6);
  assert.match(FOUNDATION_PRESENTATION_SCRIPT_PARAGRAPHS[0], /Foundation/);
  assert.match(FOUNDATION_MODEL_HIGHLIGHTS[0].title, /20 RDV/);
  assert.doesNotMatch(FOUNDATION_MODEL_HIGHLIGHTS[0].description, /10 missions/i);

  const roiScript = formatFoundationRoiScript(3_600, "l'invisibilité de zone");
  assert.match(roiScript, /20 RDV B2B/);
  assert.match(roiScript, /3 mois/);
  assert.match(roiScript, /60\s?000/);
  assert.doesNotMatch(roiScript, /7\s?197/);
  assert.doesNotMatch(roiScript, /5\s?000/);

  assert.equal(COMPTABLE_DIFFERENTIATOR_OPTIONS.length, 7);
  const labels = COMPTABLE_DIFFERENTIATOR_OPTIONS.map((option) => option.label).join(" ");
  assert.doesNotMatch(labels, /moins cher/i);

  const userFacingCopy = [
    ...COMPTABLE_PRESENTATION_PARAGRAPHS,
    ...COMPTABLE_MODEL_HIGHLIGHTS.map((item) => item.description),
    ...COMPTABLE_NICHE_BENCHMARK.advantages.items,
    ...COMPTABLE_NICHE_BENCHMARK.disadvantages.items,
    COMPTABLE_PERFORMANCE_REPORTING_RULE.description,
  ].join(" ");
  assert.doesNotMatch(userFacingCopy, /\bMRR\b/i);

  console.log("OK lib/admin/funnels/comptable-sales-copy.test.ts");
}

main();
