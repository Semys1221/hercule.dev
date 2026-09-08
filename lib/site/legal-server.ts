import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { LegalAudience } from "@/lib/site/legal-content";
import type { LegalDocType } from "@/lib/admin/legal-preview";

const DOC_DIR = join(process.cwd(), "doc/tech-stack");

function filenameForDoc(docType: LegalDocType, audience: LegalAudience): string {
  if (docType === "cgv") {
    if (audience === "entreprise") return "cvg_entreprise.md";
    if (audience === "comptable") return "cvg_comptable.md";
    return "cvg_master.md";
  }
  if (docType === "mentions") {
    return "mentions_legales.md";
  }
  if (docType === "confidentialite") {
    return "confidentialite.md";
  }
  throw new Error(`Unsupported legal doc type: ${docType}`);
}

export function readLegalMarkdown(
  docType: LegalDocType,
  audience: LegalAudience,
): string {
  const filename = filenameForDoc(docType, audience);
  return readFileSync(join(DOC_DIR, filename), "utf-8");
}

export function writeLegalMarkdown(
  docType: LegalDocType,
  audience: LegalAudience,
  markdown: string,
): string {
  const filename = filenameForDoc(docType, audience);
  writeFileSync(join(DOC_DIR, filename), markdown, "utf-8");
  return markdown;
}
