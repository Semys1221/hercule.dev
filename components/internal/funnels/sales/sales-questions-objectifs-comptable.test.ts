/** Unit tests for comptable objectifs question order (aligned with agence). */

import assert from "node:assert/strict";

import { getSalesQuestionsForSection } from "@/components/internal/funnels/sales/sales-questions";

function main() {
  const questions = getSalesQuestionsForSection("objectifs", "comptable");

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

  console.log("OK components/internal/funnels/sales/sales-questions-objectifs-comptable.test.ts");
}

main();
