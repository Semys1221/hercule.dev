/** Unit tests for audience-aware sales qualification schema. */

import assert from "node:assert/strict";

import {
  COMPTABLE_ANNUAL_TYPICAL,
} from "@/components/internal/funnels/sales/sales-questions-comptable";
import {
  CIF_ANNUAL_TYPICAL,
} from "@/components/internal/funnels/sales/sales-questions-cif";
import {
  getSalesQualificationDefaultValues,
  getSalesQualificationProgress,
  isSalesQualificationComplete,
  isSalesSectionComplete,
} from "@/lib/admin/funnels/sales-qualification-schema";
import {
  SALES_TEST_SESSION_COMPTABLE_QUALIFICATION,
  SALES_TEST_SESSION_CIF_QUALIFICATION,
  SALES_TEST_SESSION_QUALIFICATION,
} from "@/lib/admin/funnels/sales-test-session-preset";

function main() {
  const comptableDefaults = getSalesQualificationDefaultValues("comptable");
  assert.equal(comptableDefaults.q14, "monthly_12");
  assert.equal(comptableDefaults.q13, COMPTABLE_ANNUAL_TYPICAL);
  assert.equal(comptableDefaults.q15, "included");
  assert.equal(comptableDefaults.q16, null);
  assert.equal(comptableDefaults.bleedDiagnosticAccepted, false);
  assert.equal(comptableDefaults.o3Duration, undefined);

  assert.deepEqual(comptableDefaults.q21, []);

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
    isSalesSectionComplete("objectifs", SALES_TEST_SESSION_COMPTABLE_QUALIFICATION, "comptable"),
    true,
  );

  assert.equal(
    isSalesSectionComplete("objectifs", SALES_TEST_SESSION_QUALIFICATION, "agence"),
    true,
  );

  assert.equal(
    isSalesSectionComplete(
      "objectifs",
      {
        ...SALES_TEST_SESSION_QUALIFICATION,
        bleedDiagnosticAccepted: false,
      },
      "agence",
    ),
    false,
    "agence objectifs requires bleedDiagnosticAccepted",
  );

  assert.equal(
    isSalesSectionComplete(
      "objectifs",
      {
        ...SALES_TEST_SESSION_COMPTABLE_QUALIFICATION,
        bleedDiagnosticAccepted: false,
      },
      "comptable",
    ),
    false,
    "objectifs requires bleedDiagnosticAccepted",
  );

  assert.equal(
    isSalesSectionComplete(
      "objectifs",
      {
        ...SALES_TEST_SESSION_COMPTABLE_QUALIFICATION,
        b5: ["word_of_mouth", "partnerships"],
        b5b: undefined,
      },
      "comptable",
    ),
    false,
    "b5b required when multiple b5 selections",
  );

  const cifDefaults = getSalesQualificationDefaultValues("cif");
  assert.equal(cifDefaults.q14, "monthly_12");
  assert.equal(cifDefaults.q13, CIF_ANNUAL_TYPICAL);
  assert.equal(cifDefaults.q15, "mixte");

  const comptableProgress = getSalesQualificationProgress(
    SALES_TEST_SESSION_COMPTABLE_QUALIFICATION,
    "comptable",
  );
  assert.equal(comptableProgress.totalSections, 6);
  assert.equal(comptableProgress.completedSections, 6);
  assert.equal(
    isSalesQualificationComplete(SALES_TEST_SESSION_COMPTABLE_QUALIFICATION, "comptable"),
    true,
  );

  const cifProgress = getSalesQualificationProgress(
    SALES_TEST_SESSION_CIF_QUALIFICATION,
    "cif",
  );
  assert.equal(cifProgress.totalSections, 6);
  assert.equal(cifProgress.completedSections, 6);
  assert.equal(
    isSalesQualificationComplete(SALES_TEST_SESSION_CIF_QUALIFICATION, "cif"),
    true,
  );

  console.log("OK lib/admin/funnels/sales-qualification-schema.test.ts");
}

main();
