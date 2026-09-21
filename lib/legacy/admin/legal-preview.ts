import {
  faqEntriesToMarkdown,
  getFaqEntries,
} from "@/lib/site/faq-data";
import {
  getConfidentialiteMarkdown,
  getCvgMarkdown,
  getMentionsLegalesMarkdown,
  type LegalAudience,
} from "@/lib/site/legal-content";

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

function getFaqMarkdown(audience: LegalAudience): string {
  const entries = getFaqEntries(audience);
  return faqEntriesToMarkdown(audience, entries);
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
  return getFaqMarkdown(audience);
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
