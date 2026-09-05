import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { AGENCE_FAQ } from "@/lib/site/agence-faq";
import {
  getConfidentialiteMarkdown,
  getCvgMarkdown,
  getMentionsLegalesMarkdown,
  type LegalAudience,
} from "@/lib/site/legal-content";

const DOC_DIR = join(process.cwd(), "doc/tech-stack");
const FRONT_CLIENT_PATH = join(DOC_DIR, "deliverance", "front-client.md");

export type LegalDocType = "cgv" | "mentions" | "confidentialite" | "faq";

export const LEGAL_DOC_LABELS: Record<LegalDocType, string> = {
  cgv: "CGV",
  mentions: "Mentions légales",
  confidentialite: "Confidentialité",
  faq: "FAQ",
};

export const LEGAL_LEAF_TO_DOC: Record<string, LegalDocType> = {
  legal_cgv: "cgv",
  legal_mentions: "mentions",
  legal_confidentialite: "confidentialite",
  legal_faq: "faq",
};

function getAgenceFaqMarkdown(): string {
  const lines = ["# FAQ agence", ""];
  for (const entry of AGENCE_FAQ) {
    lines.push(`## ${entry.question}`, "", entry.answer, "");
  }
  return lines.join("\n").trim();
}

function getEntrepriseFaqMarkdown(): string {
  if (!existsSync(FRONT_CLIENT_PATH)) {
    return "# FAQ entreprise\n\nSource introuvable.";
  }

  const raw = readFileSync(FRONT_CLIENT_PATH, "utf-8");
  const start = raw.indexOf("### Questions entreprise");
  if (start < 0) {
    return "# FAQ entreprise\n\nSection introuvable dans front-client.md.";
  }

  let section = raw.slice(start);
  const end = section.indexOf("---", 10);
  if (end > 0) {
    section = section.slice(0, end);
  }

  const lines = ["# FAQ entreprise", ""];
  const rows = [...section.matchAll(/\| E\d+ \| ([^|]+) \| ([^|]+) \|/g)];
  for (const [, question, answer] of rows) {
    lines.push(`## ${question.trim()}`, "", answer.trim(), "");
  }
  return lines.join("\n").trim();
}

export function getAudienceLegalMarkdown(
  audience: LegalAudience,
  docType: LegalDocType,
): string {
  if (docType === "cgv") {
    return getCvgMarkdown(audience);
  }
  if (docType === "mentions") {
    return getMentionsLegalesMarkdown();
  }
  if (docType === "confidentialite") {
    return getConfidentialiteMarkdown();
  }
  return audience === "agence" ? getAgenceFaqMarkdown() : getEntrepriseFaqMarkdown();
}

export function getLegalMarkdownForLeaf(
  audience: LegalAudience,
  leaf: string,
): { docType: LegalDocType; label: string; markdown: string } | null {
  const docType = LEGAL_LEAF_TO_DOC[leaf];
  if (!docType) {
    return null;
  }
  return {
    docType,
    label: LEGAL_DOC_LABELS[docType],
    markdown: getAudienceLegalMarkdown(audience, docType),
  };
}
