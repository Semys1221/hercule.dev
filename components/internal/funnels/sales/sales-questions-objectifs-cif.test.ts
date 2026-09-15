/** Unit tests for CIF objectifs wizard questions. */

import assert from "node:assert/strict";

import { getSalesQuestionsForSection } from "@/components/internal/funnels/sales/sales-questions";
import { getSalesFunnelSection } from "@/components/internal/funnels/sales/sales-funnel-sections";

function main() {
  const questions = getSalesQuestionsForSection("objectifs", "cif");
  const section = getSalesFunnelSection("objectifs", "cif");

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
      "w19",
      "w8",
      "w8Tried",
      "w8TriedWho",
      "w8Brake",
      "w9",
      "w8Criteria",
      "w10",
      "w11",
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

  assert.match(questions[0]?.prompt ?? "", /objectif/i);
  assert.ok(
    (questions[0]?.type === "single" ? questions[0].options : []).some((option) =>
      /mandats/i.test(option.label),
    ),
  );
  const promptCopy = questions
    .filter((question) => question.id !== "diagnostic_card")
    .map((question) => question.prompt)
    .join(" ");
  assert.ok(!/lead/i.test(promptCopy));
  assert.ok(!/audit/i.test(promptCopy));

  const w19 = questions.find((question) => question.id === "w19");
  assert.match(w19?.prompt ?? "", /rémunération annuelle moyenne/i);

  assert.match(questions[2]?.prompt ?? "", /encours/i);

  assert.equal(section?.title, "Objectifs");

  console.log("OK components/internal/funnels/sales/sales-questions-objectifs-cif.test.ts");
}

main();
