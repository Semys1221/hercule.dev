import agenceFaqData from "@/content/faq/agence.json";
import cifFaqData from "@/content/faq/cif.json";
import comptableFaqData from "@/content/faq/comptable.json";
import entrepriseFaqData from "@/content/faq/entreprise.json";
import type { FaqAudience, FaqComponentConfig, FaqDocument, FaqEntry } from "@/lib/site/faq-types";
import { faqDocumentSchema } from "@/lib/site/faq-types";

const BUNDLED_FAQ: Record<FaqAudience, FaqDocument> = {
  agence: faqDocumentSchema.parse(agenceFaqData),
  entreprise: faqDocumentSchema.parse(entrepriseFaqData),
  comptable: faqDocumentSchema.parse(comptableFaqData),
  cif: faqDocumentSchema.parse(cifFaqData),
};

export function getFaqEntries(audience: FaqAudience): FaqEntry[] {
  return BUNDLED_FAQ[audience].entries;
}

export function getBundledFaqDocument(audience: FaqAudience): FaqDocument {
  return BUNDLED_FAQ[audience];
}

export function resolveFaqForComponent(
  audience: FaqAudience,
  config: FaqComponentConfig,
): FaqEntry[] {
  const canonical = getFaqEntries(audience);
  const hidden = new Set(config.hiddenIds);
  const visible = canonical.filter((entry) => !hidden.has(entry.id));
  return [...visible, ...config.localEntries];
}

const FAQ_TITLES: Record<FaqAudience, string> = {
  agence: "FAQ agence",
  entreprise: "FAQ entreprise",
  comptable: "FAQ comptable",
  cif: "FAQ conseiller financier",
};

export function faqEntriesToMarkdown(audience: FaqAudience, entries: FaqEntry[]): string {
  const title = FAQ_TITLES[audience];
  const lines = [`# ${title}`, ""];
  for (const entry of entries) {
    lines.push(`## ${entry.question}`, "", entry.answer, "");
  }
  return lines.join("\n").trim();
}

const FAQ_ID_PREFIX: Record<FaqAudience, string> = {
  agence: "faq-ag",
  entreprise: "faq-en",
  comptable: "faq-cp",
};

export function generateFaqEntryId(audience: FaqAudience, entries: FaqEntry[]): string {
  const prefix = FAQ_ID_PREFIX[audience];
  let max = 0;
  for (const entry of entries) {
    const match = entry.id.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}
