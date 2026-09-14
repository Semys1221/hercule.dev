/** Unit tests for pitch wizard gates and interpolation. */

import assert from "node:assert/strict";

import {
  formatHonorairesLabel,
  formatPitchWizardInterpolation,
  getVisiblePitchStepIds,
  isPitchFieldComplete,
  isPitchStepVisible,
  PITCH_STEP_IDS,
} from "@/lib/admin/funnels/sales-pitch-wizard";
import { PITCH_P0_TRANSITION_TEMPLATE } from "@/lib/admin/funnels/sales-pitch-bleed-copy";
import { buildCabinetPitchPresetValues } from "@/lib/admin/funnels/sales-pitch-wizard-preset";
import { mergeSalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import {
  SALES_TEST_SESSION_COMPTABLE_QUALIFICATION,
  SALES_TEST_SESSION_CIF_QUALIFICATION,
} from "@/lib/admin/funnels/sales-test-session-preset";

function main() {
  const comptableValues = mergeSalesQualificationValues(
    {
      ...SALES_TEST_SESSION_COMPTABLE_QUALIFICATION,
      ...buildCabinetPitchPresetValues("comptable"),
    },
    "comptable",
  );

  assert.equal(isPitchFieldComplete("p6", { ...comptableValues, p5BuyIn: "questions" }, "comptable"), false);
  assert.equal(isPitchFieldComplete("p6", comptableValues, "comptable"), true);
  assert.equal(
    isPitchFieldComplete("p7", { ...comptableValues, p7FoundationBuyIn: "questions" }, "comptable"),
    false,
  );
  assert.equal(isPitchFieldComplete("p7", comptableValues, "comptable"), true);
  assert.equal(isPitchFieldComplete("p8", { ...comptableValues, p7BuyIn: "questions" }, "comptable"), false);
  assert.equal(isPitchFieldComplete("pRoi", { ...comptableValues, pRoiAcknowledged: false }, "comptable"), false);
  assert.equal(
    isPitchFieldComplete("p11", { ...comptableValues, p11WhyId: undefined }, "comptable"),
    false,
  );
  assert.equal(
    isPitchFieldComplete("p12", { ...comptableValues, p12WhyId: undefined }, "comptable"),
    false,
  );
  assert.equal(
    isPitchFieldComplete("p11", { ...comptableValues, p11TempCheck: "hesitant" }, "comptable"),
    true,
  );
  assert.equal(
    isPitchFieldComplete(
      "p2",
      { ...comptableValues, p2DecisionMakers: "missing", p2MissingRole: undefined },
      "comptable",
    ),
    false,
  );
  assert.equal(
    isPitchFieldComplete(
      "p2",
      { ...comptableValues, p2DecisionMakers: "missing", p2MissingRole: "associate" },
      "comptable",
    ),
    true,
  );

  assert.equal(
    isPitchStepVisible("p12", { ...comptableValues, p11TempCheck: "hesitant" }, "comptable"),
    false,
    "p12 hidden when hesitant",
  );
  assert.equal(
    isPitchStepVisible("p12", { ...comptableValues, p11WhyId: undefined }, "comptable"),
    false,
    "p12 hidden when p11WhyId empty",
  );
  assert.equal(isPitchStepVisible("p12", comptableValues, "comptable"), true);

  const withoutDiagnostic = mergeSalesQualificationValues(
    { bleedDiagnosticAccepted: false },
    "comptable",
  );
  assert.equal(
    getVisiblePitchStepIds(withoutDiagnostic, "comptable").length,
    0,
    "no pitch steps before diagnostic card accepted",
  );

  const visibleIds = getVisiblePitchStepIds(comptableValues, "comptable");
  assert.ok(visibleIds.includes("p1b"));
  assert.ok(visibleIds.includes("pRoi"));
  assert.ok(visibleIds.includes("pDashboard"));
  assert.ok(visibleIds.includes("p12"));
  assert.equal(visibleIds.at(-1), "pDashboard");
  assert.equal(visibleIds.indexOf("p12"), visibleIds.indexOf("pDashboard") - 1);
  assert.equal(visibleIds.indexOf("pRoi"), visibleIds.indexOf("p11") - 1);
  assert.equal(PITCH_STEP_IDS.length, 17);

  const honorairesFromQ13 = formatHonorairesLabel(
    { ...comptableValues, q13: 240_000 },
    "comptable",
  );
  assert.match(honorairesFromQ13, /240/);

  const honorairesFromW3 = formatHonorairesLabel(
    {
      ...comptableValues,
      q13: undefined as unknown as number,
      w3: 500_000,
    },
    "comptable",
  );
  assert.match(honorairesFromW3, /500/);

  const interpolated = formatPitchWizardInterpolation(
    "Honoraires : {honoraires}. Zone {department}.",
    comptableValues,
    "comptable",
    { prospectFirstName: "Marie", department: "Rhône (69)" },
  );
  assert.match(interpolated, /Marie|Honoraires/);
  assert.match(interpolated, /Rhône \(69\)/);

  const transitionCopy = formatPitchWizardInterpolation(
    PITCH_P0_TRANSITION_TEMPLATE,
    comptableValues,
    "comptable",
    { prospectFirstName: "Marie" },
  );
  assert.match(transitionCopy, /Marie/);
  assert.doesNotMatch(transitionCopy, /\{goal6m\}/);

  const cifValues = mergeSalesQualificationValues(
    {
      ...SALES_TEST_SESSION_CIF_QUALIFICATION,
      ...buildCabinetPitchPresetValues("cif"),
    },
    "cif",
  );
  assert.equal(isPitchFieldComplete("pCgv", cifValues, "cif"), true);

  console.log("OK lib/admin/funnels/sales-pitch-wizard.test.ts");
}

main();
