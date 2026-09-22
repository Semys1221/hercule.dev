/**
 * Export Notion canon → app/(marketing)/content/legal-documentation + sanity check constants.
 *
 * Notion DB Offres is the editorial master. This script documents the sync contract
 * and re-asserts that app/(marketing)/content/ mirrors canon pricing v3
 * (DEC Mercantile 1499 · Hercule Hubris 4000 / 1800).
 *
 * Full Notion API pull can be wired later via NOTION_TOKEN; for now we validate
 * the committed export that agents maintain from the Hercule Canon hub.
 *
 * Usage: pnpm exec tsx scripts/notion/exportLegal.ts
 */

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  COMMERCIAL_COMPTABLE,
  COMMERCIAL_HERCULE_HUBRIS,
} from "@/lib/commercial/constants";
import { LEGAL_DOCUMENTATION_ROOT, getSharedCvgMarkdownPath } from "@/lib/legacy/legal-documentation/paths";

const REQUIRED = [
  "_shared/cgv.md",
  "_shared/mentions-legales.md",
  "_shared/confidentialite.md",
  "comptable/cgv.md",
  "comptable/faq.json",
  "comptable/pricing.json",
  "assurance/cgv.md",
  "assurance/faq.json",
  "assurance/pricing.json",
  "cif/cgv.md",
  "cif/faq.json",
  "cif/pricing.json",
] as const;

for (const rel of REQUIRED) {
  const path = join(LEGAL_DOCUMENTATION_ROOT, rel);
  assert.ok(existsSync(path), `missing export: ${rel}`);
}

const cgv = readFileSync(getSharedCvgMarkdownPath(), "utf-8");
assert.ok(cgv.includes("Evan Sinclair"), "mentions framing: groupement Sinclair in CGV");
assert.ok(cgv.includes("4 000"), "Hubris Option A in CGV");
assert.ok(cgv.includes("1 800"), "Hubris Option B in CGV");
assert.ok(cgv.includes("Hubris"), "Hubris section in CGV");
assert.ok(cgv.includes("Mercantile"), "Mercantile section in CGV");
assert.equal(COMMERCIAL_COMPTABLE.monthlyPriceCents, 149_900);
assert.equal(COMMERCIAL_COMPTABLE.commitmentMonths, 1);
assert.equal(COMMERCIAL_HERCULE_HUBRIS.optionAFlatCents, 400_000);
assert.equal(COMMERCIAL_HERCULE_HUBRIS.optionBMonthlyCents, 180_000);

console.log("exportLegal.ts: app/(marketing)/content/legal-documentation mirrors Notion canon v3");
console.log("  Hub: https://app.notion.com/p/3e130179aa978187a2d9c4f2bc4733fc");
console.log("  Next: pnpm legal:validate");
