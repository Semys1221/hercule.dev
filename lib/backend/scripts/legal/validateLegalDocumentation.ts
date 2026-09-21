/** Validate alignment between legal-documentation (app/(marketing)/content/) and commercial constants (canon v3). */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  COMMERCIAL_COMPTABLE,
  COMMERCIAL_HERCULE_HUBRIS,
} from "@/lib/commercial/constants";
import {
  cgvMarkdownPath,
  getSharedCvgMarkdownPath,
  pricingJsonPath,
} from "@/lib/legacy/legal-documentation/paths";
import { getPricingDocument } from "@/lib/site/pricing-data";

function assertContains(haystack: string, needle: string, label: string): void {
  assert.ok(haystack.includes(needle), `${label}: expected to find "${needle}"`);
}

function assertNotContains(haystack: string, needle: string, label: string): void {
  assert.ok(!haystack.includes(needle), `${label}: must not contain "${needle}"`);
}

const cvgBody = readFileSync(getSharedCvgMarkdownPath(), "utf-8");
assertContains(cvgBody, "1 499", "CGV DEC price");
assertContains(cvgBody, "4 000", "CGV Hubris Option A");
assertContains(cvgBody, "1 800", "CGV Hubris Option B");
assertContains(cvgBody, "Hubris", "CGV Hubris section");
assertContains(cvgBody, "Mercantile", "CGV Mercantile section");
assertContains(cvgBody, "Engagement", "CGV DEC engagement");
assertNotContains(cvgBody, "3 598", "CGV must not list DEC pack 3 598");
assertNotContains(cvgBody, "4 798", "CGV must not list IAS pack 4 798");
assert.ok(!cvgBody.includes("1 799"), "CGV must not mention Lite 1 799");
assert.ok(!cvgBody.includes("2 199"), "CGV must not mention Starter 2 199");
assert.ok(
  !cvgBody.includes("### 3.2 Pack Assureur"),
  "CGV must not keep standalone IAS section header",
);
assert.ok(
  !cvgBody.includes("### 3.3 Pack Conseiller"),
  "CGV must not keep standalone CIF section header",
);
assert.ok(
  !/\*\*Garantie MRR/i.test(cvgBody) && !/garantie de revenus récurrents/i.test(cvgBody),
  "CGV must not promise MRR guarantee",
);

for (const niche of ["comptable", "cif", "assurance"] as const) {
  assertContains(readFileSync(cgvMarkdownPath(niche), "utf-8"), "1 499", `${niche} cgv sync`);
  assertContains(readFileSync(cgvMarkdownPath(niche), "utf-8"), "4 000", `${niche} hubris sync`);
}

const comptablePricing = getPricingDocument("comptable");
assert.ok(comptablePricing, "comptable pricing.json must exist");
const decPlan = comptablePricing!.plans.find((plan) => plan.offerType === "monthly_1499");
assert.ok(decPlan, "comptable DEC monthly plan");
assert.ok(decPlan!.price.includes("1 499"), "comptable DEC price label");
assert.equal(COMMERCIAL_COMPTABLE.monthlyPriceCents, 149_900, "constants DEC monthly");
assert.equal(COMMERCIAL_COMPTABLE.commitmentMonths, 3, "constants DEC commitment");

const assurancePricing = getPricingDocument("assurance");
assert.ok(assurancePricing, "assurance pricing.json must exist");
assert.ok(
  assurancePricing!.plans.some((plan) => plan.offerType === "hercule_hubris_4000_flat"),
  "assurance Hubris Option A",
);
assert.ok(
  assurancePricing!.plans.some((plan) => plan.offerType === "hercule_hubris_1800_monthly"),
  "assurance Hubris Option B",
);
assert.ok(
  assurancePricing!.plans.some((plan) => plan.price.includes("4 000")),
  "assurance Hubris Option A price",
);
assert.ok(
  assurancePricing!.plans.some((plan) => plan.price.includes("1 800")),
  "assurance Hubris Option B price",
);

const cifPricing = getPricingDocument("cif");
assert.ok(cifPricing, "cif pricing.json must exist");
assert.ok(
  cifPricing!.plans.some((plan) => plan.offerType === "hercule_hubris_4000_flat"),
  "cif Hubris Option A",
);
assert.ok(
  cifPricing!.plans.some((plan) => plan.price.includes("4 000")),
  "cif Hubris Option A price",
);

assert.equal(COMMERCIAL_HERCULE_HUBRIS.optionAFlatCents, 400_000);
assert.equal(COMMERCIAL_HERCULE_HUBRIS.optionBMonthlyCents, 180_000);
assert.equal(COMMERCIAL_HERCULE_HUBRIS.commitmentMonths, 3);

readFileSync(pricingJsonPath("comptable"), "utf-8");
readFileSync(pricingJsonPath("cif"), "utf-8");
readFileSync(pricingJsonPath("assurance"), "utf-8");

console.log("validateLegalDocumentation.ts: ok (canon v3)");
