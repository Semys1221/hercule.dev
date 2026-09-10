/** Unit tests for audience-aware sales qualification schema. */

import assert from "node:assert/strict";

import {
  COMPTABLE_ANNUAL_MIN,
  COMPTABLE_ANNUAL_TYPICAL,
} from "@/components/internal/funnels/sales/sales-questions-comptable";
import {
  getSalesQualificationDefaultValues,
  isSalesSectionComplete,
} from "@/lib/admin/funnels/sales-qualification-schema";
import { SALES_TEST_SESSION_COMPTABLE_QUALIFICATION } from "@/lib/admin/funnels/sales-test-session-preset";

function main() {
  const comptableDefaults = getSalesQualificationDefaultValues("comptable");
  assert.equal(comptableDefaults.q14, "monthly_12");
  assert.equal(comptableDefaults.q13, COMPTABLE_ANNUAL_TYPICAL);
  assert.equal(comptableDefaults.q15, "included");
  assert.equal(comptableDefaults.q16, null);

  assert.equal(
    isSalesSectionComplete(
      "standards",
      {
        ...SALES_TEST_SESSION_COMPTABLE_QUALIFICATION,
        q13: COMPTABLE_ANNUAL_MIN,
        q14: "annual",
      },
      "comptable",
    ),
    true,
  );

  assert.equal(
    isSalesSectionComplete(
      "standards",
      {
        ...SALES_TEST_SESSION_COMPTABLE_QUALIFICATION,
        q13: COMPTABLE_ANNUAL_MIN - 1,
      },
      "comptable",
    ),
    false,
  );

  assert.equal(
    isSalesSectionComplete("objectifs", SALES_TEST_SESSION_COMPTABLE_QUALIFICATION, "comptable"),
    true,
  );

  assert.equal(
    isSalesSectionComplete(
      "objectifs",
      {
        ...SALES_TEST_SESSION_COMPTABLE_QUALIFICATION,
        o6: "",
      },
      "comptable",
    ),
    false,
  );

  console.log("OK lib/admin/funnels/sales-qualification-schema.test.ts");
}

main();
