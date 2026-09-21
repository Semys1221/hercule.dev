/** Unit tests for CIF bleed tunnel objectifs questions. */

import assert from "node:assert/strict";

import { getSalesQuestionsForSection } from "@/components/legacy/internal/funnels/sales/sales-questions";
import { getSalesFunnelSection } from "@/components/legacy/internal/funnels/sales/sales-funnel-sections";

function main() {
  const questions = getSalesQuestionsForSection("objectifs", "cif");
  const section = getSalesFunnelSection("objectifs", "cif");

  assert.deepEqual(
    questions.map((question) => question.id),
    ["b1", "b2", "b3", "b4", "b5", "b5b", "b6", "b7", "b8", "diagnostic_card"],
  );

  assert.match(questions[0]?.prompt ?? "", /priorité du cabinet/);
  assert.ok(
    (questions[0]?.type === "single" ? questions[0].options : []).some((option) =>
      /mandats \/ études/i.test(option.label),
    ),
  );
  const promptCopy = questions
    .filter((question) => question.id !== "diagnostic_card")
    .map((question) => question.prompt)
    .join(" ");
  assert.ok(!/lead/i.test(promptCopy));
  assert.ok(!/audit/i.test(promptCopy));

  assert.equal(section?.title, "Objectifs");

  console.log("OK components/internal/funnels/sales/sales-questions-objectifs-cif.test.ts");
}

main();
