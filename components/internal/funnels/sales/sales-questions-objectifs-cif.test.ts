/** Unit tests for CIF objectifs question order (aligned with comptable & agence). */

import assert from "node:assert/strict";

import { getSalesQuestionsForSection } from "@/components/internal/funnels/sales/sales-questions";
import { getSalesFunnelSection } from "@/components/internal/funnels/sales/sales-funnel-sections";

function main() {
  const questions = getSalesQuestionsForSection("objectifs", "cif");
  const section = getSalesFunnelSection("objectifs", "cif");

  assert.deepEqual(
    questions.map((question) => question.id),
    ["o2", "o3", "o4", "o5", "o6", "o1"],
  );

  assert.equal(questions[0]?.number, 1);
  assert.equal(questions[0]?.id, "o2");
  assert.equal(questions[5]?.number, 6);
  assert.equal(questions[5]?.id, "o1");

  assert.match(
    questions[5]?.prompt ?? "",
    /^En synthèse, quelles difficultés/,
  );
  assert.match(
    questions[1]?.prompt ?? "",
    /^Pourquoi êtes-vous à cette capacité/,
  );
  assert.match(
    questions[2]?.prompt ?? "",
    /^Qu'est-ce qui vous freine pour remplir davantage cette capacité/,
  );

  assert.equal(section?.title, "Objectifs");
  assert.notEqual(section?.title, "Objectifs & douleur");

  console.log("OK components/internal/funnels/sales/sales-questions-objectifs-cif.test.ts");
}

main();
