/** Unit tests for cabinet live track concatenation. */

import assert from "node:assert/strict";

import {
  getLiveTrackSection,
  getVisibleLiveTrackStepIds,
} from "@/lib/legacy/admin/funnels/sales-cabinet-live-track";
import { buildCabinetPitchPresetValues } from "@/lib/legacy/admin/funnels/sales-pitch-wizard-preset";
import { getImmersiveChartPresence } from "@/lib/legacy/admin/funnels/sales-objectifs-wizard";
import { mergeSalesQualificationValues } from "@/lib/legacy/admin/funnels/sales-qualification-schema";
import { SALES_TEST_SESSION_COMPTABLE_QUALIFICATION } from "@/lib/legacy/admin/funnels/sales-test-session-preset";

function main() {
  assert.equal(getLiveTrackSection("w1"), "objectifs");
  assert.equal(getLiveTrackSection("diagnostic_card"), "objectifs");
  assert.equal(getLiveTrackSection("p0"), "pitch");
  assert.equal(getLiveTrackSection("pCgv"), "pitch");

  assert.equal(getImmersiveChartPresence("w1"), "off");
  assert.equal(getImmersiveChartPresence("w2"), "peek");
  assert.equal(getImmersiveChartPresence("w5"), "moment");
  assert.equal(getImmersiveChartPresence("w18"), "hero");
  assert.equal(getImmersiveChartPresence("diagnostic_card"), "hero");
  assert.equal(getImmersiveChartPresence("p0"), "peek");
  assert.equal(getImmersiveChartPresence("p11"), "off");

  const objectifsOnly = mergeSalesQualificationValues(
    {
      ...SALES_TEST_SESSION_COMPTABLE_QUALIFICATION,
      bleedDiagnosticAccepted: false,
    },
    "comptable",
  );
  const objectifsTrack = getVisibleLiveTrackStepIds(objectifsOnly, "comptable");
  assert.ok(objectifsTrack.includes("w1"));
  assert.ok(objectifsTrack.includes("diagnostic_card"));
  assert.equal(objectifsTrack.some((stepId) => stepId.startsWith("p")), false);

  const fullValues = mergeSalesQualificationValues(
    {
      ...SALES_TEST_SESSION_COMPTABLE_QUALIFICATION,
      ...buildCabinetPitchPresetValues("comptable"),
    },
    "comptable",
  );
  const fullTrack = getVisibleLiveTrackStepIds(fullValues, "comptable");
  const diagnosticIndex = fullTrack.indexOf("diagnostic_card");
  const pitchStart = fullTrack.indexOf("p0");
  assert.ok(diagnosticIndex >= 0);
  assert.ok(pitchStart > diagnosticIndex);
  assert.equal(fullTrack.at(-1), "pDashboard");
  assert.equal(fullTrack.at(-2), "p11");

  console.log("sales-cabinet-live-track.test.ts: all assertions passed");
}

main();
