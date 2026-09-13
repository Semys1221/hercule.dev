/** Validate alignment between legal-documentation files and commercial constants. */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { COMMERCIAL, COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";
import { cgvMarkdownPath, pricingJsonPath } from "@/lib/legal-documentation/paths";
import { getPricingDocument } from "@/lib/site/pricing-data";

function readCgv(niche: "agence" | "comptable"): string {
  return readFileSync(cgvMarkdownPath(niche), "utf-8");
}

function assertContains(haystack: string, needle: string, label: string): void {
  assert.ok(haystack.includes(needle), `${label}: expected to find "${needle}"`);
}

// Agence pricing JSON ↔ CGV mentions of starter/growth price labels
const agencePricing = getPricingDocument("agence");
assert.ok(agencePricing, "agence pricing.json must exist");
assert.equal(agencePricing!.guaranteeSection, null);
const agenceCgv = readCgv("agence");
for (const plan of agencePricing!.plans) {
  assertContains(agenceCgv, plan.price.replace(/\s/g, " "), `agence CGV vs ${plan.id}`);
}

// Comptable pricing ↔ constants cents (display strings)
const comptablePricing = getPricingDocument("comptable");
assert.ok(comptablePricing, "comptable pricing.json must exist");
const comptableCgv = readCgv("comptable");
const litePlan = comptablePricing!.plans.find((plan) => plan.id === "plan-comptable-lite");
assert.ok(litePlan, "comptable lite plan");
assert.equal(
  litePlan!.price.includes("998"),
  COMMERCIAL_COMPTABLE.starterPriceCents === 99_800,
  "comptable lite price alignment",
);
assertContains(comptableCgv, "998", "comptable CGV lite price");

// Sanity: agence starter cents in constants
assert.equal(COMMERCIAL.starter998PriceCents, 99_800);

// Files exist at new paths
readFileSync(pricingJsonPath("comptable"), "utf-8");
readFileSync(pricingJsonPath("cif"), "utf-8");

console.log("validateLegalDocumentation.ts: ok");
