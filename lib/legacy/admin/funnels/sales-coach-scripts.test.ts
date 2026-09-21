/** Unit tests for sales coach scripts and ROI anchoring. */

import assert from "node:assert/strict";

import { COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";
import {
  computeHonorairesRoiAnchoring,
  getCoachScriptForQuestion,
  requiresO3FollowUp,
  type SalesCoachContext,
} from "@/lib/legacy/admin/funnels/sales-coach-scripts";
import { FOUNDATION_ROI_DISPLAY } from "@/lib/legacy/admin/funnels/comptable-sales-copy";

const COMPTABLE_ANNUAL_MIN = COMMERCIAL_COMPTABLE.honorairesAnnuelsMinCents / 100;

const baseContext: SalesCoachContext = {
  audience: "comptable",
  firstName: "Marie",
  clientSegment: { active: true, label: "TPE" },
  questionId: "o3",
  o3Value: "insufficient_prospects",
};

function main() {
  const roi = computeHonorairesRoiAnchoring(3_600, "l'invisibilité de zone");
  assert.equal(roi.guaranteeRdvCount, FOUNDATION_ROI_DISPLAY.guaranteeRdvCount);
  assert.equal(roi.guaranteeWindowMonths, FOUNDATION_ROI_DISPLAY.guaranteeWindowMonths);
  assert.equal(roi.yearOneValueEur, FOUNDATION_ROI_DISPLAY.yearOneValueEur);
  assert.match(roi.script, /3\s?600\s?€/);
  assert.match(roi.script, /20 RDV B2B/);
  assert.match(roi.script, /3 mois/);
  assert.match(roi.script, /60\s?000/);
  assert.doesNotMatch(roi.script, /7\s?197/);
  assert.doesNotMatch(roi.script, /5\s?000/);
  assert.doesNotMatch(roi.script, /20–30 %/);

  const cifRoi = computeHonorairesRoiAnchoring(3_600, "la trésorerie dirigeant");
  assert.match(cifRoi.script, /20 RDV B2B/);

  const o3Script = getCoachScriptForQuestion({
    ...baseContext,
    questionId: "o3",
    bleedCause: "l'invisibilité de zone",
  });
  assert.ok(o3Script);
  assert.match(o3Script!, /Marie/);
  assert.match(o3Script!, /invisibilité de zone/);

  const o4Script = getCoachScriptForQuestion({
    ...baseContext,
    questionId: "o4",
    selectedOptionIds: ["weak_channels"],
  });
  assert.ok(o4Script);
  assert.match(o4Script!, /6 prochains mois/);

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
      bleedCause: "l'invisibilité de zone",
    },
    COMPTABLE_ANNUAL_MIN,
  );
  assert.ok(q13Script);
  assert.match(q13Script!, /20 RDV B2B/);
  assert.doesNotMatch(q13Script!, /7\s?197/);

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
