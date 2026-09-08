import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { PricingAudience, PricingDocument } from "@/lib/site/pricing-types";
import { pricingDocumentSchema } from "@/lib/site/pricing-types";

import { getBundledPricingDocument } from "./pricing-data";

const CONTENT_DIR = join(process.cwd(), "content", "pricing");

export function readPricingDocument(audience: PricingAudience): PricingDocument {
  try {
    const raw = readFileSync(join(CONTENT_DIR, `${audience}.json`), "utf-8");
    return pricingDocumentSchema.parse(JSON.parse(raw));
  } catch {
    const bundled = getBundledPricingDocument(audience);
    if (!bundled) {
      throw new Error("Pricing document not found");
    }
    return bundled;
  }
}

export function writePricingDocument(document: PricingDocument): PricingDocument {
  const parsed = pricingDocumentSchema.parse(document);
  writeFileSync(
    join(CONTENT_DIR, `${parsed.audience}.json`),
    `${JSON.stringify(parsed, null, 2)}\n`,
    "utf-8",
  );
  return parsed;
}
