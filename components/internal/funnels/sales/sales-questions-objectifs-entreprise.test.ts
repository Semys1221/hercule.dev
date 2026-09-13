/** Unit tests for entreprise linear bleed objectifs questions. */

import assert from "node:assert/strict";

import { getSalesQuestionsForSection } from "@/components/internal/funnels/sales/sales-questions";
import { LINEAR_DIAGNOSTIC_MIRROR_TEMPLATE } from "@/lib/admin/funnels/sales-bleed-copy";

function main() {
  const questions = getSalesQuestionsForSection("objectifs", "entreprise");

  assert.deepEqual(
    questions.map((question) => question.id),
    ["o1", "o2", "o3", "o4", "o5", "o6", "diagnostic_card"],
  );

  const o3 = questions.find((question) => question.id === "o3");
  assert.ok(o3?.coachCue);

  const o4 = questions.find((question) => question.id === "o4");
  assert.match(o4?.prompt ?? "", /\{business\}/);

  const o6 = questions.find((question) => question.id === "o6");
  assert.deepEqual(o6?.showCoachCueWhen, ["major_gap", "significant_gap"]);

  const diagnostic = questions.find((question) => question.id === "diagnostic_card");
  assert.equal(diagnostic?.type, "diagnostic_card");
  assert.equal(diagnostic?.mirrorTemplate, LINEAR_DIAGNOSTIC_MIRROR_TEMPLATE);

  assert.ok(!questions.some((question) => question.id.startsWith("b")));

  console.log("OK components/internal/funnels/sales/sales-questions-objectifs-entreprise.test.ts");
}

main();
