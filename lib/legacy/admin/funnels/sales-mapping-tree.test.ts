/** Unit tests for sales mapping tree definitions. */

import assert from "node:assert/strict";

import {
  DASHBOARD_STEP_IDS,
  isDashboardStepVisible,
} from "@/lib/legacy/admin/funnels/sales-dashboard-wizard";
import { getRecoveryStepIds } from "@/lib/legacy/dashboard/closing-recovery";
import {
  collectMappingNodeIds,
  getMappingFlow,
  getMappingNodeDetail,
} from "@/lib/legacy/admin/funnels/sales-mapping-tree";
import {
  isPitchStepVisible,
  PITCH_STEP_IDS,
  usesPitchWizard,
} from "@/lib/legacy/admin/funnels/sales-pitch-wizard";
import {
  isWizardStepVisible,
  WIZARD_QUESTION_IDS,
} from "@/lib/legacy/admin/funnels/sales-objectifs-wizard";
import type { SalesQualificationValues } from "@/lib/legacy/admin/funnels/sales-qualification-schema";

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

    const pitchGateDetail = getMappingNodeDetail("pitch", "pitch_gate", audience);
    assert.ok(pitchGateDetail?.condition?.includes("bleedDiagnosticAccepted"));

    const dashboardIds = collectMappingNodeIds("dashboard");
    assert.ok(dashboardIds.includes("dashboard_gate"), `dashboard_gate required for ${audience}`);
    for (const id of DASHBOARD_STEP_IDS) {
      assert.ok(dashboardIds.includes(id), `dashboard mapping should include ${id} for ${audience}`);
    }
    for (const id of getRecoveryStepIds()) {
      assert.ok(
        dashboardIds.includes(id),
        `dashboard recovery mapping should include ${id} for ${audience}`,
      );
    }

    const d3Detail = getMappingNodeDetail("dashboard", "d3", audience);
    assert.ok(d3Detail?.options?.length);
    assert.ok(d3Detail?.condition?.includes("fit"));

    const discoveryFlow = getMappingFlow("discovery", audience);
    for (const id of WIZARD_QUESTION_IDS) {
      const title = discoveryFlow.nodes[id]?.title ?? "";
      assert.ok(
        !title.toLowerCase().includes("le cabinet"),
        `discovery node ${id} title should not repeat "le cabinet" (${audience}): ${title}`,
      );
    }

    const w2Detail = getMappingNodeDetail("discovery", "w2", audience);
    assert.equal(w2Detail?.title, "Clients actuels");
    assert.match(w2Detail?.prompt ?? "", /le cabinet/i);
  }

  const discoveryFlow = getMappingFlow("discovery", "cif");
  assert.equal(discoveryFlow.rootId, "w1");
  assert.ok(discoveryFlow.nodes.w16?.condition);
  assert.ok(discoveryFlow.nodes.w19?.title.includes("LTV"));
  assert.ok(discoveryFlow.nodes.w9?.title);
  assert.ok(discoveryFlow.nodes.diagnostic_card?.condition);

  const pitchFlow = getMappingFlow("pitch", "comptable");
  assert.equal(pitchFlow.rootId, "pitch_gate");
  assert.ok(pitchFlow.nodes.pDashboard?.condition);
  assert.ok(pitchFlow.nodes.pGuarantee);

  const dashboardFlow = getMappingFlow("dashboard", "comptable");
  assert.equal(dashboardFlow.rootId, "dashboard_gate");
  assert.ok(dashboardFlow.nodes.d5Commit?.condition);
  assert.ok(dashboardFlow.nodes.d5FinalCommit?.condition);
  assert.ok(dashboardFlow.nodes["service-fit"]?.condition);
  assert.ok(dashboardFlow.nodes.d5Stripe?.condition);

  const visibilityCases: Array<{
    questionId: string;
    values: Partial<SalesQualificationValues>;
    expected: boolean;
  }> = [
    { questionId: "wExchangeWhy13", values: { w13: "yes" }, expected: true },
    {
      questionId: "wExchangeWhy13",
      values: { w13: "yes", wExchangeWhy13: "certainty" },
      expected: false,
    },
    { questionId: "w13Why", values: { w13: "yes" }, expected: false },
    { questionId: "w13Why", values: { w13: "no" }, expected: true },
    { questionId: "w16", values: { w15: "wait", w14: "12m" }, expected: false },
    { questionId: "w16", values: { w15: "shortcut", w14: "12m" }, expected: true },
    { questionId: "w16StrategicSub", values: { w16: "strategic" }, expected: true },
    { questionId: "w16Detail", values: { w16: "other" }, expected: true },
    { questionId: "wExchangeWhy15", values: { w15: "wait", w14: "12m" }, expected: true },
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
  assert.ok(pitchFlow.nodes.pGuarantee?.title.includes("20 RDV"));
  assert.equal(
    isPitchStepVisible("pDashboard", {
      ...pitchValues,
      p11TempCheck: "hesitant",
    } as SalesQualificationValues, "comptable"),
    false,
  );

  assert.equal(
    isDashboardStepVisible("d5Commit", { stripeRevealed: false }),
    true,
  );
  assert.equal(
    isDashboardStepVisible("d5Stripe", { stripeRevealed: true }),
    true,
  );
  assert.equal(
    isDashboardStepVisible("service-fit", {
      closing: { commit: "hesitate", recoveryCycle: 0 },
    }),
    true,
  );
  assert.equal(
    isDashboardStepVisible("service-fit", {
      closing: { commit: "launch", recoveryCycle: 0 },
    }),
    false,
  );
  assert.equal(
    isDashboardStepVisible("service-fit", {
      closing: { commit: "hesitate", recoveryCycle: 2 },
    }),
    false,
  );
  assert.equal(
    isDashboardStepVisible("d5FinalCommit", {
      closing: { recoveryCycle: 2, finalCommitAccepted: false },
    }),
    true,
  );
  assert.equal(
    isDashboardStepVisible("d5Commit", {
      closing: { recoveryCycle: 2 },
    }),
    false,
  );

  console.log("OK lib/admin/funnels/sales-mapping-tree.test.ts");
}

main();
