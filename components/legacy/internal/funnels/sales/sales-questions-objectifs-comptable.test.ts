/** Unit tests for comptable bleed tunnel objectifs questions. */

import assert from "node:assert/strict";

import { getSalesQuestionsForSection } from "@/components/legacy/internal/funnels/sales/sales-questions";
import { getB7Options } from "@/lib/legacy/admin/funnels/sales-bleed-tunnel";

function main() {
  const questions = getSalesQuestionsForSection("objectifs", "comptable");

  assert.deepEqual(
    questions.map((question) => question.id),
    ["b1", "b2", "b3", "b4", "b5", "b5b", "b6", "b7", "b8", "diagnostic_card"],
  );

  assert.match(questions[0]?.prompt ?? "", /priorité du cabinet/);
  assert.ok(
    (questions[0]?.type === "single" ? questions[0].options : []).some((option) =>
      /dossiers/i.test(option.label),
    ),
  );
  assert.ok(!(questions[0]?.prompt ?? "").match(/lead/i));

  const b6 = questions.find((question) => question.id === "b6");
  assert.equal(b6?.type, "acknowledgment");

  const diagnostic = questions.find((question) => question.id === "diagnostic_card");
  assert.equal(diagnostic?.type, "diagnostic_card");

  assert.equal(getB7Options("seo").length, 4);
  assert.equal(getB7Options("nothing").length, 4);
  assert.notDeepEqual(getB7Options("seo"), getB7Options("ads"));

  console.log("OK components/internal/funnels/sales/sales-questions-objectifs-comptable.test.ts");
}

main();
