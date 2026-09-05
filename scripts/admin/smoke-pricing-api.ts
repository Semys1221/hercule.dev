/** Smoke tests for pricing admin API data layer. */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { readPricingDocument, writePricingDocument } from "@/lib/site/pricing-server";
import { pricingDocumentSchema } from "@/lib/site/pricing-types";

const document = readPricingDocument("agence");
assert.equal(document.audience, "agence");
assert.equal(document.plans.length, 2);

const parsed = pricingDocumentSchema.parse(
  JSON.parse(readFileSync(join(process.cwd(), "content/pricing/agence.json"), "utf-8")),
);
assert.equal(parsed.plans[0].name, "Hercule Starter");

writePricingDocument(document);
const reloaded = readPricingDocument("agence");
assert.equal(reloaded.plans.length, 2);

console.log("smoke-pricing-api.ts: ok");
