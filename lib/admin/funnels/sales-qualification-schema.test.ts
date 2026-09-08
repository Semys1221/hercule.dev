/** Unit tests for audience-aware sales qualification schema. */

import assert from "node:assert/strict";

import { COMPTABLE_MONTHLY_MIN } from "@/components/internal/funnels/sales/sales-questions-comptable";
import {
  getSalesQualificationDefaultValues,
  isSalesSectionComplete,
} from "@/lib/admin/funnels/sales-qualification-schema";
import { SALES_TEST_SESSION_COMPTABLE_QUALIFICATION } from "@/lib/admin/funnels/sales-test-session-preset";

function main() {
  const comptableDefaults = getSalesQualificationDefaultValues("comptable");
  assert.equal(comptableDefaults.q14.months3, COMPTABLE_MONTHLY_MIN);
  assert.equal(comptableDefaults.q13, COMPTABLE_MONTHLY_MIN);

  assert.equal(
    isSalesSectionComplete(
      "standards",
      {
        ...SALES_TEST_SESSION_COMPTABLE_QUALIFICATION,
        q14: {
          months3: COMPTABLE_MONTHLY_MIN,
          months6: COMPTABLE_MONTHLY_MIN,
          months12: COMPTABLE_MONTHLY_MIN,
        },
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
        q14: {
          months3: COMPTABLE_MONTHLY_MIN - 1,
          months6: COMPTABLE_MONTHLY_MIN,
          months12: COMPTABLE_MONTHLY_MIN,
        },
      },
      "comptable",
    ),
    false,
  );

  console.log("OK lib/admin/funnels/sales-qualification-schema.test.ts");
}

main();
