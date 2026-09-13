import { readFileSync, writeFileSync } from "node:fs";

import {
  cgvMarkdownPath,
  sharedLegalDocPath,
  type LegalDocumentationNiche,
} from "@/lib/legal-documentation/paths";
import type { LegalAudience } from "@/lib/site/legal-content";
import type { LegalDocType } from "@/lib/admin/legal-preview";

function filenameForDoc(docType: LegalDocType, audience: LegalAudience): string {
  if (docType === "cgv") {
    return cgvMarkdownPath(audience as LegalDocumentationNiche);
  }
  if (docType === "mentions") {
    return sharedLegalDocPath("mentions");
  }
  if (docType === "confidentialite") {
    return sharedLegalDocPath("confidentialite");
  }
  throw new Error(`Unsupported legal doc type: ${docType}`);
}

export function readLegalMarkdown(
  docType: LegalDocType,
  audience: LegalAudience,
): string {
  const path = filenameForDoc(docType, audience);
  return readFileSync(path, "utf-8");
}

export function writeLegalMarkdown(
  docType: LegalDocType,
  audience: LegalAudience,
  markdown: string,
): string {
  const path = filenameForDoc(docType, audience);
  writeFileSync(path, markdown, "utf-8");
  return markdown;
}
