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

  assert.equal(model.guaranteeRdvCount, FOUNDATION_ROI_DISPLAY.guaranteeRdvCount);
  assert.equal(model.guaranteeWindowMonths, FOUNDATION_ROI_DISPLAY.guaranteeWindowMonths);
  assert.equal(model.yearOneValueEur, FOUNDATION_ROI_DISPLAY.yearOneValueEur);
  assert.equal(model.bars.length, 2);
  assert.match(model.bars[0]?.formatted ?? "", /20 RDV B2B/);
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
