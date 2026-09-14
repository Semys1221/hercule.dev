/** Unit tests for sales mapping tree definitions. */

import assert from "node:assert/strict";

import {
  collectMappingNodeIds,
  getMappingFlow,
  getMappingNodeDetail,
} from "@/lib/admin/funnels/sales-mapping-tree";
import {
  isPitchStepVisible,
  PITCH_STEP_IDS,
  usesPitchWizard,
} from "@/lib/admin/funnels/sales-pitch-wizard";
import {
  isWizardStepVisible,
  WIZARD_QUESTION_IDS,
} from "@/lib/admin/funnels/sales-objectifs-wizard";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";

const AUDIENCES = ["comptable", "cif"] as const;

function main() {
  for (const audience of AUDIENCES) {
    const discoveryIds = collectMappingNodeIds("discovery");
    for (const id of WIZARD_QUESTION_IDS) {
      assert.ok(
        discoveryIds.includes(id),
        `discovery mapping should include ${id} for ${audience}`,
      );
    }

    const pitchIds = collectMappingNodeIds("pitch");
    assert.ok(pitchIds.includes("pitch_gate"), `pitch_gate required for ${audience}`);
    for (const id of PITCH_STEP_IDS) {
      assert.ok(pitchIds.includes(id), `pitch mapping should include ${id} for ${audience}`);
    }

    const w8BrakeDetail = getMappingNodeDetail("discovery", "w8Brake", audience);
    assert.ok(w8BrakeDetail?.dynamicOptionsByMethod?.length);
    assert.ok(w8BrakeDetail?.condition?.includes("w8"));

    const pitchGateDetail = getMappingNodeDetail("pitch", "pitch_gate", audience);
    assert.ok(pitchGateDetail?.condition?.includes("bleedDiagnosticAccepted"));
  }

  const discoveryFlow = getMappingFlow("discovery", "cif");
  assert.equal(discoveryFlow.rootId, "w1");
  assert.ok(discoveryFlow.nodes.w16?.condition);
  assert.ok(discoveryFlow.nodes.diagnostic_card?.condition);

  const pitchFlow = getMappingFlow("pitch", "comptable");
  assert.equal(pitchFlow.rootId, "pitch_gate");
  assert.ok(pitchFlow.nodes.pDashboard?.condition);
  assert.ok(pitchFlow.nodes.p12?.condition);

  const visibilityCases: Array<{
    questionId: string;
    values: Partial<SalesQualificationValues>;
    expected: boolean;
  }> = [
    { questionId: "w8TriedWho", values: { w8Tried: "none" }, expected: false },
    { questionId: "w8TriedWho", values: { w8Tried: "tried" }, expected: true },
    { questionId: "w16", values: { w15: "wait", w14: "12m" }, expected: false },
    { questionId: "w16", values: { w15: "shortcut", w14: "12m" }, expected: true },
    { questionId: "w16Detail", values: { w16: "strategic" }, expected: false },
    { questionId: "w16Detail", values: { w16: "other" }, expected: true },
    { questionId: "diagnostic_card", values: { w17Acknowledged: false }, expected: false },
    { questionId: "diagnostic_card", values: { w17Acknowledged: true }, expected: true },
  ];

  for (const { questionId, values, expected } of visibilityCases) {
    assert.equal(
      isWizardStepVisible(questionId, values as SalesQualificationValues),
      expected,
      `isWizardStepVisible(${questionId})`,
    );
  }

  const pitchValues = {
    bleedDiagnosticAccepted: true,
    p11WhyId: "zone_lock",
    p11TempCheck: "yes",
  } as SalesQualificationValues;

  assert.equal(usesPitchWizard(pitchValues), true);
  assert.equal(isPitchStepVisible("pDashboard", pitchValues, "comptable"), true);
  assert.equal(isPitchStepVisible("p12", pitchValues, "comptable"), true);
  assert.equal(
    isPitchStepVisible("pDashboard", {
      ...pitchValues,
      p11TempCheck: "hesitant",
    } as SalesQualificationValues, "comptable"),
    false,
  );

  console.log("OK lib/admin/funnels/sales-mapping-tree.test.ts");
}

main();
