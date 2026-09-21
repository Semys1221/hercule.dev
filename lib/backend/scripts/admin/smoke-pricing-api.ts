/** Smoke tests for pricing admin API data layer. */

import assert from "node:assert/strict";

import { pricingJsonPath } from "@/lib/legacy/legal-documentation/paths";
import { readJsonFile } from "@/lib/legacy/legal-documentation/read-json";
import { readPricingDocument, writePricingDocument } from "@/lib/site/pricing-server";
import { pricingDocumentSchema } from "@/lib/site/pricing-types";

const document = readPricingDocument("agence");
assert.equal(document.audience, "agence");
assert.equal(document.plans.length, 3);

const parsed = pricingDocumentSchema.parse(readJsonFile(pricingJsonPath("agence")));
assert.equal(parsed.plans[0].name, "Hercule Starter");

writePricingDocument(document);
const reloaded = readPricingDocument("agence");
assert.equal(reloaded.plans.length, 3);

console.log("smoke-pricing-api.ts: ok");
