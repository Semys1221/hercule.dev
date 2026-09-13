/** Unit tests for CIF sales copy — Foundation framing lexique. */

import assert from "node:assert/strict";

import {
  CIF_FOUNDATION_MODEL_HIGHLIGHTS,
  CIF_FOUNDATION_PRESENTATION_SCRIPT_PARAGRAPHS,
  CIF_PRESENTATION_PARAGRAPHS,
  formatCifFoundationRoiScript,
} from "./cif-sales-copy";

function main() {
  const presentation = CIF_PRESENTATION_PARAGRAPHS.join(" ");
  assert.match(presentation, /Pappers/);
  assert.doesNotMatch(presentation, /10 missions/i);
  assert.doesNotMatch(presentation, /Starter/i);
  assert.doesNotMatch(presentation, /Calendly Pro/i);

  assert.match(CIF_FOUNDATION_PRESENTATION_SCRIPT_PARAGRAPHS[1], /étude/);
  assert.doesNotMatch(CIF_FOUNDATION_PRESENTATION_SCRIPT_PARAGRAPHS[1], /\baudit\b/i);
  assert.match(CIF_FOUNDATION_MODEL_HIGHLIGHTS[0].title, /5 000/);

  const roiScript = formatCifFoundationRoiScript(3_600, "la trésorerie dirigeant");
  assert.match(roiScript, /7\s?197/);
  assert.doesNotMatch(roiScript, /10 RDV/i);

  console.log("OK lib/admin/funnels/cif-sales-copy.test.ts");
}

main();
