import { join } from "node:path";

import type { FaqAudience } from "@/lib/site/faq-types";
import type { PricingAudience } from "@/lib/site/pricing-types";

/** Git-backed legal documentation root. */
export const LEGAL_DOCUMENTATION_ROOT = join(process.cwd(), "doc", "legal-documentation");

export type LegalDocumentationNiche = FaqAudience;

export type LegalDocKind = "cgv" | "pricing" | "faq";

export type SharedLegalDocKind = "mentions" | "confidentialite";

const NICHE_FOLDER: Record<LegalDocumentationNiche, string> = {
  agence: "agence",
  entreprise: "entreprise",
  comptable: "comptable",
  cif: "cif",
  jum: "comptable",
};

export function legalDocumentationNicheDir(niche: LegalDocumentationNiche): string {
  return join(LEGAL_DOCUMENTATION_ROOT, NICHE_FOLDER[niche]);
}

export function cgvMarkdownPath(niche: LegalDocumentationNiche): string {
  return join(legalDocumentationNicheDir(niche), "cgv.md");
}

export function pricingJsonPath(audience: PricingAudience): string {
  return join(legalDocumentationNicheDir(audience), "pricing.json");
}

export function faqJsonPath(audience: FaqAudience): string {
  return join(legalDocumentationNicheDir(audience), "faq.json");
}

export function sharedLegalDocPath(kind: SharedLegalDocKind): string {
  const filename = kind === "mentions" ? "mentions-legales.md" : "confidentialite.md";
  return join(LEGAL_DOCUMENTATION_ROOT, "_shared", filename);
}

export function sequenceMarkdownPath(niche: LegalDocumentationNiche, slug: string): string {
  return join(legalDocumentationNicheDir(niche), "sequences", `${slug}.md`);
}

export function sequencesDir(niche: LegalDocumentationNiche): string {
  return join(legalDocumentationNicheDir(niche), "sequences");
}

/** Legacy doc/tech-stack paths — stubs point here after migration. */
export const LEGACY_TECH_STACK_DOC_DIR = join(process.cwd(), "doc", "tech-stack");

export const LEGACY_CGV_FILENAMES: Record<LegalDocumentationNiche, string> = {
  agence: "cvg_master.md",
  entreprise: "cvg_entreprise.md",
  comptable: "cvg_comptable.md",
  cif: "cvg_cif.md",
  jum: "cvg_comptable.md",
};
