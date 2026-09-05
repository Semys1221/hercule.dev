import agenceFaqData from "@/content/faq/agence.json";
import entrepriseFaqData from "@/content/faq/entreprise.json";
import type { FaqAudience, FaqComponentConfig, FaqDocument, FaqEntry } from "@/lib/site/faq-types";
import { faqDocumentSchema } from "@/lib/site/faq-types";

const BUNDLED_FAQ: Record<FaqAudience, FaqDocument> = {
  agence: faqDocumentSchema.parse(agenceFaqData),
  entreprise: faqDocumentSchema.parse(entrepriseFaqData),
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

export function faqEntriesToMarkdown(audience: FaqAudience, entries: FaqEntry[]): string {
  const title = audience === "agence" ? "FAQ agence" : "FAQ entreprise";
  const lines = [`# ${title}`, ""];
  for (const entry of entries) {
    lines.push(`## ${entry.question}`, "", entry.answer, "");
  }
  return lines.join("\n").trim();
}

export function generateFaqEntryId(audience: FaqAudience, entries: FaqEntry[]): string {
  const prefix = audience === "agence" ? "faq-ag" : "faq-en";
  let max = 0;
  for (const entry of entries) {
    const match = entry.id.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}
