/** Unit tests for pitch bleed copy and choice builders. */

import assert from "node:assert/strict";

import {
  getPitchP11WhyOptions,
  getPitchP12WhyOptions,
} from "@/lib/admin/funnels/sales-pitch-bleed-copy";
import { mergeSalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import {
  SALES_TEST_SESSION_COMPTABLE_QUALIFICATION,
} from "@/lib/admin/funnels/sales-test-session-preset";

function main() {
  const baseValues = mergeSalesQualificationValues(
    SALES_TEST_SESSION_COMPTABLE_QUALIFICATION,
    "comptable",
  );

  const defaultOptions = getPitchP11WhyOptions(baseValues, "comptable");
  assert.ok(defaultOptions.length >= 4);
  assert.ok(defaultOptions.some((option) => option.id === "zone_lock"));
  assert.ok(defaultOptions.some((option) => option.id === "close_gap"));

  const withBrake = getPitchP11WhyOptions(
    { ...baseValues, w13: "no", w8Brake: "budget" },
    "comptable",
  );
  assert.ok(withBrake.some((option) => option.id === "replace_method"));

  const withUrgency = getPitchP11WhyOptions(
    { ...baseValues, w15: "shortcut" },
    "comptable",
  );
  assert.ok(withUrgency.some((option) => option.id === "urgency"));

  const withCriteria = getPitchP11WhyOptions(
    { ...baseValues, w8Criteria: ["predictable_flow"] },
    "comptable",
  );
  assert.ok(withCriteria.some((option) => option.id === "criteria_fit"));

  const coreOptions = getPitchP12WhyOptions("core", baseValues, "comptable");
  assert.equal(coreOptions.length, 3);
  assert.ok(coreOptions.every((option) => option.id !== "guarantee_5000"));

  const horizonOptions = getPitchP12WhyOptions("horizon", baseValues, "comptable");
  assert.equal(horizonOptions.length, 3);
  assert.ok(horizonOptions.some((option) => option.id === "gap_ambition"));
  assert.match(horizonOptions.find((option) => option.id === "gap_ambition")?.label ?? "", /6 mois|écart/i);

  console.log("OK lib/admin/funnels/sales-pitch-bleed-copy.test.ts");
}

main();
