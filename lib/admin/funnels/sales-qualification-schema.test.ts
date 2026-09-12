/** Unit tests for audience-aware sales qualification schema. */

import assert from "node:assert/strict";

import {
  COMPTABLE_ANNUAL_MIN,
  COMPTABLE_ANNUAL_TYPICAL,
} from "@/components/internal/funnels/sales/sales-questions-comptable";
import {
  CIF_ANNUAL_MIN,
  CIF_ANNUAL_TYPICAL,
} from "@/components/internal/funnels/sales/sales-questions-cif";
import {
  getSalesQualificationDefaultValues,
  isSalesSectionComplete,
} from "@/lib/admin/funnels/sales-qualification-schema";
import { SALES_TEST_SESSION_COMPTABLE_QUALIFICATION, SALES_TEST_SESSION_CIF_QUALIFICATION } from "@/lib/admin/funnels/sales-test-session-preset";

function main() {
  const comptableDefaults = getSalesQualificationDefaultValues("comptable");
  assert.equal(comptableDefaults.q14, "monthly_12");
  assert.equal(comptableDefaults.q13, COMPTABLE_ANNUAL_TYPICAL);
  assert.equal(comptableDefaults.q15, "included");
  assert.equal(comptableDefaults.q16, null);

  assert.deepEqual(comptableDefaults.q21, []);

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
        q21: [],
      },
      "comptable",
    ),
    false,
  );

  assert.equal(
    isSalesSectionComplete(
      "standards",
      {
        ...getSalesQualificationDefaultValues("agence"),
        introConfirmed: true,
        presentationConfirmed: true,
        q11: ["tpe"],
        q12: "simple",
        q13: 2000,
        q14: {
          months3: 2000,
          months6: 2000,
          months12: 2000,
        },
        q21: [],
      },
      "agence",
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

  const cifDefaults = getSalesQualificationDefaultValues("cif");
  assert.equal(cifDefaults.q14, "monthly_12");
  assert.equal(cifDefaults.q13, CIF_ANNUAL_TYPICAL);
  assert.equal(cifDefaults.q15, "mixte");

  assert.equal(
    isSalesSectionComplete(
      "standards",
      {
        ...SALES_TEST_SESSION_CIF_QUALIFICATION,
        q21: [],
      },
      "cif",
    ),
    false,
  );

  assert.equal(
    isSalesSectionComplete(
      "standards",
      {
        ...SALES_TEST_SESSION_CIF_QUALIFICATION,
        q13: CIF_ANNUAL_MIN,
      },
      "cif",
    ),
    true,
  );

  console.log("OK lib/admin/funnels/sales-qualification-schema.test.ts");
}

main();
