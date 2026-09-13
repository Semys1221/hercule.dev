import { writeFileSync } from "node:fs";

import { pricingJsonPath } from "@/lib/legal-documentation/paths";
import { readJsonFile } from "@/lib/legal-documentation/read-json";
import type { PricingAudience, PricingDocument } from "@/lib/site/pricing-types";
import { pricingDocumentSchema } from "@/lib/site/pricing-types";

export function readPricingDocument(audience: PricingAudience): PricingDocument {
  return pricingDocumentSchema.parse(readJsonFile(pricingJsonPath(audience)));
}

export function writePricingDocument(document: PricingDocument): PricingDocument {
  const parsed = pricingDocumentSchema.parse(document);
  writeFileSync(
    pricingJsonPath(parsed.audience),
    `${JSON.stringify(parsed, null, 2)}\n`,
    "utf-8",
  );
  return parsed;
}
