import { writeFileSync } from "node:fs";

import { faqJsonPath } from "@/lib/legal-documentation/paths";
import { readJsonFile } from "@/lib/legal-documentation/read-json";
import type { FaqAudience, FaqDocument } from "@/lib/site/faq-types";
import { faqDocumentSchema } from "@/lib/site/faq-types";

export function readFaqDocument(audience: FaqAudience): FaqDocument {
  return faqDocumentSchema.parse(readJsonFile(faqJsonPath(audience)));
}

export function writeFaqDocument(document: FaqDocument): FaqDocument {
  const parsed = faqDocumentSchema.parse(document);
  writeFileSync(faqJsonPath(parsed.audience), `${JSON.stringify(parsed, null, 2)}\n`, "utf-8");
  return parsed;
}
