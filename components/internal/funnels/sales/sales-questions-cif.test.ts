/** Unit tests for CIF sales questions vocabulary. */

import assert from "node:assert/strict";

import { getSalesQuestions, getSalesQuestionsForSection } from "@/components/internal/funnels/sales/sales-questions";
import { getSalesFunnelSections } from "@/components/internal/funnels/sales/sales-funnel-sections";

function main() {
  const questions = getSalesQuestionsForSection("capacite", "cif");
  assert.match(questions[0]?.prompt ?? "", /missions votre cabinet propose/);
  assert.ok(
    (questions[0]?.options ?? []).some((option) => option.label.includes("Patrimoine")),
  );
  assert.ok(
    !(questions[0]?.options ?? []).some((option) => /tenue|paie|DSN|liasse/i.test(option.label)),
  );

  const q15 = getSalesQuestions("cif").find((question) => question.id === "q15");
  assert.match(q15?.prompt ?? "", /principalement rémunéré/);
  assert.ok(
    (q15?.options ?? []).some((option) => option.id === "mixte"),
  );
  assert.ok(
    !(q15?.options ?? []).some((option) => /social|paie/i.test(option.label)),
  );

  const q21 = getSalesQuestions("cif").find((question) => question.id === "q21");
  assert.match(q21?.prompt ?? "", /banque privée ou un CGP/);

  const sections = getSalesFunnelSections("cif");
  const standards = sections.find((section) => section.id === "standards");
  assert.match(standards?.subtitle ?? "", /banque privée ou d'un CGP/);
  assert.ok(!/expert-comptable|tenue|social \/ paie/i.test(JSON.stringify(sections)));

  console.log("OK components/internal/funnels/sales/sales-questions-cif.test.ts");
}

main();
