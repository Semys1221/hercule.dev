/** Unit tests for pitch ROI calculator model. */

import assert from "node:assert/strict";

import { FOUNDATION_ROI_DISPLAY } from "@/lib/admin/funnels/comptable-sales-copy";
import { buildPitchRoiModel } from "@/lib/admin/funnels/sales-pitch-roi";
import { mergeSalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import { SALES_TEST_SESSION_COMPTABLE_QUALIFICATION } from "@/lib/admin/funnels/sales-test-session-preset";

function main() {
  const values = mergeSalesQualificationValues(
    SALES_TEST_SESSION_COMPTABLE_QUALIFICATION,
    "comptable",
  );
  const model = buildPitchRoiModel(values, "comptable");

  assert.equal(model.investment90DaysEur, FOUNDATION_ROI_DISPLAY.investment90DaysEur);
  assert.equal(model.guaranteeMrrEur, FOUNDATION_ROI_DISPLAY.guaranteeMrrEur);
  assert.equal(model.yearOneValueEur, FOUNDATION_ROI_DISPLAY.yearOneValueEur);
  assert.equal(model.bars.length, 3);
  assert.ok(model.roiMultiple > 8);
  assert.match(model.roiMultipleLabel, /×/);
  assert.ok(model.honorairesEur > 0);

  const fromW3 = buildPitchRoiModel(
    {
      ...values,
      q13: undefined as unknown as number,
      w3: 420_000,
    },
    "comptable",
  );
  assert.equal(fromW3.honorairesEur, 420_000);

  console.log("OK lib/admin/funnels/sales-pitch-roi.test.ts");
}

main();
