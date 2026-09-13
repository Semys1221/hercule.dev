/** Unit tests for sales coach scripts and ROI anchoring. */

import assert from "node:assert/strict";

import { COMPTABLE_ANNUAL_MIN } from "@/components/internal/funnels/sales/sales-questions-comptable";
import {
  computeHonorairesRoiAnchoring,
  getCoachScriptForQuestion,
  requiresO3FollowUp,
  type SalesCoachContext,
} from "@/lib/admin/funnels/sales-coach-scripts";
import { COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";

const baseContext: SalesCoachContext = {
  audience: "comptable",
  firstName: "Marie",
  clientSegment: { active: true, label: "TPE" },
  questionId: "o3",
  o3Value: "insufficient_prospects",
};

function main() {
  const roi = computeHonorairesRoiAnchoring(3_600, "comptable");
  assert.equal(roi.missions, COMMERCIAL_COMPTABLE.growthMissionsPerMonth);
  assert.equal(roi.closeRateLow, 20);
  assert.equal(roi.closeRateHigh, 30);
  assert.equal(roi.signedLow, 2);
  assert.equal(roi.signedHigh, 3);
  assert.equal(roi.recurringLowEur, 7_200);
  assert.equal(roi.recurringHighEur, 10_800);
  assert.equal(roi.recurringMidEur, 9_000);
  assert.match(roi.script, /3\s?600\s?€/);
  assert.match(roi.script, /10 RDV/);
  assert.match(roi.script, /20–30 %/);

  const cifRoi = computeHonorairesRoiAnchoring(3_600, "cif");
  assert.match(cifRoi.script, /mandat/);

  const o3Script = getCoachScriptForQuestion({
    ...baseContext,
    questionId: "o3",
  });
  assert.ok(o3Script);
  assert.match(o3Script!, /Marie/);
  assert.match(o3Script!, /Flux de prospects insuffisant/);

  const o4Script = getCoachScriptForQuestion({
    ...baseContext,
    questionId: "o4",
    selectedOptionIds: ["weak_channels"],
  });
  assert.ok(o4Script);
  assert.match(o4Script!, /6 prochains mois/);

  const o6Script = getCoachScriptForQuestion({
    ...baseContext,
    questionId: "o6",
    o6Value: "major_gap",
  });
  assert.ok(o6Script);
  assert.match(o6Script!, /6 mois/);

  const o6Hidden = getCoachScriptForQuestion({
    ...baseContext,
    questionId: "o6",
    o6Value: "near_target",
  });
  assert.equal(o6Hidden, null);

  const historiqueIntro = getCoachScriptForQuestion({
    ...baseContext,
    questionId: "historique_intro",
  });
  assert.ok(historiqueIntro);
  assert.match(historiqueIntro!, /fiabilité de production/);

  const q21Script = getCoachScriptForQuestion({
    ...baseContext,
    questionId: "q21",
    selectedOptionIds: ["reactivite", "outils"],
  });
  assert.ok(q21Script);
  assert.match(q21Script!, /Pennylane/);

  const cifQ21 = getCoachScriptForQuestion({
    ...baseContext,
    audience: "cif",
    questionId: "q21",
    selectedOptionIds: ["architecture_ouverte"],
  });
  assert.ok(cifQ21);
  assert.match(cifQ21!, /Architecture ouverte/);

  const q13Script = getCoachScriptForQuestion(
    {
      ...baseContext,
      questionId: "q13",
      sliderValue: 3_600,
    },
    COMPTABLE_ANNUAL_MIN,
  );
  assert.ok(q13Script);
  assert.match(q13Script!, /7\s?200/);

  const q13Hidden = getCoachScriptForQuestion(
    {
      ...baseContext,
      questionId: "q13",
      sliderValue: COMPTABLE_ANNUAL_MIN - 1,
    },
    COMPTABLE_ANNUAL_MIN,
  );
  assert.equal(q13Hidden, null);

  const agenceScript = getCoachScriptForQuestion({
    ...baseContext,
    audience: "agence",
    questionId: "o3",
  });
  assert.equal(agenceScript, null);

  assert.equal(requiresO3FollowUp("insufficient_prospects"), true);
  assert.equal(requiresO3FollowUp("full_capacity"), false);

  console.log("sales-coach-scripts.test.ts: ok");
}

main();
