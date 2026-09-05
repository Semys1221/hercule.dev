import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { FaqAudience, FaqDocument } from "@/lib/site/faq-types";
import { faqDocumentSchema } from "@/lib/site/faq-types";

import { getBundledFaqDocument } from "./faq-data";

const CONTENT_DIR = join(process.cwd(), "content", "faq");

function faqFilePath(audience: FaqAudience): string {
  return join(CONTENT_DIR, `${audience}.json`);
}

export function readFaqDocument(audience: FaqAudience): FaqDocument {
  try {
    const raw = readFileSync(faqFilePath(audience), "utf-8");
    return faqDocumentSchema.parse(JSON.parse(raw));
  } catch {
    return getBundledFaqDocument(audience);
  }
}

export function writeFaqDocument(document: FaqDocument): FaqDocument {
  const parsed = faqDocumentSchema.parse(document);
  writeFileSync(faqFilePath(parsed.audience), `${JSON.stringify(parsed, null, 2)}\n`, "utf-8");
  return parsed;
}
