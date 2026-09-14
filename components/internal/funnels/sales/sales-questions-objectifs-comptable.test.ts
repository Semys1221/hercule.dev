/** Unit tests for comptable objectifs wizard questions. */

import assert from "node:assert/strict";

import { getSalesQuestionsForSection } from "@/components/internal/funnels/sales/sales-questions";

function main() {
  const questions = getSalesQuestionsForSection("objectifs", "comptable");

  assert.deepEqual(
    questions.map((question) => question.id),
    [
      "w1",
      "w2",
      "w3",
      "w4",
      "w5",
      "w6",
      "w7",
      "w8",
      "w8Tried",
      "w8TriedWho",
      "w8Criteria",
      "w8Brake",
      "w9",
      "w10",
      "w11",
      "w12",
      "w13",
      "w13Why",
      "w14",
      "w15",
      "w16",
      "w16Detail",
      "w18",
      "w17",
      "diagnostic_card",
    ],
  );

  assert.match(questions[0]?.prompt ?? "", /objectif/i);
  assert.ok(
    (questions[0]?.type === "single" ? questions[0].options : []).some((option) =>
      /dossiers/i.test(option.label),
    ),
  );
  assert.ok(!(questions[0]?.prompt ?? "").match(/lead/i));

  const w9 = questions.find((question) => question.id === "w9");
  assert.equal(w9?.type, "acknowledgment");

  const diagnostic = questions.find((question) => question.id === "diagnostic_card");
  assert.equal(diagnostic?.type, "diagnostic_card");

  assert.match(questions[2]?.prompt ?? "", /chiffre d'affaires/i);

  console.log("OK components/internal/funnels/sales/sales-questions-objectifs-comptable.test.ts");
}

main();
