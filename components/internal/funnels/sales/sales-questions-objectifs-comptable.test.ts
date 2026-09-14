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
      "w10",
      "w12",
      "w13",
      "wExchangeWhy13",
      "w13Why",
      "w14",
      "wExchangeWhy14",
      "w15",
      "wExchangeWhy15",
      "w16",
      "w16StrategicSub",
      "w16ResaleSub",
      "w16Detail",
      "w18",
      "wExchangeWhy18",
      "w17",
      "diagnostic_card",
    ],
  );

  assert.match(questions[0]?.prompt ?? "", /objectif du cabinet/i);
  assert.ok(
    (questions[0]?.type === "single" ? questions[0].options : []).some((option) =>
      /dossiers/i.test(option.label),
    ),
  );
  assert.ok(!(questions[0]?.prompt ?? "").match(/lead/i));

  const w13Why = questions.find((question) => question.id === "w13Why");
  assert.equal(w13Why?.type, "single");

  const w16Detail = questions.find((question) => question.id === "w16Detail");
  assert.equal(w16Detail?.type, "single");
  assert.ok(
    (w16Detail?.type === "single" ? w16Detail.options : []).length >= 6,
    "w16Detail should expose multiple urgency options",
  );

  const w17 = questions.find((question) => question.id === "w17");
  assert.equal(w17?.type, "acknowledgment");

  const diagnostic = questions.find((question) => question.id === "diagnostic_card");
  assert.equal(diagnostic?.type, "diagnostic_card");

  assert.match(questions[2]?.prompt ?? "", /honoraires annuels/i);

  console.log("OK components/internal/funnels/sales/sales-questions-objectifs-comptable.test.ts");
}

main();
