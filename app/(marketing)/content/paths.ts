import { join } from "node:path";

import type { FaqAudience } from "@/lib/site/faq-types";
import type { PricingAudience } from "@/lib/site/pricing-types";

export const SITE_CONTENT_ROOT = join(process.cwd(), "app", "(marketing)", "content");

/** Canon legal documentation (FAQ, pricing, CGV, sequences git mirror). */
export const LEGAL_DOCUMENTATION_ROOT = join(SITE_CONTENT_ROOT, "legal-documentation");

export type LegalDocumentationNiche = FaqAudience;

export type LegalDocKind = "cgv" | "pricing" | "faq";

export type SharedLegalDocKind = "mentions" | "confidentialite";

const NICHE_FOLDER: Record<LegalDocumentationNiche, string> = {
  agence: "agence",
  entreprise: "entreprise",
  comptable: "comptable",
  cif: "cif",
  jum: "comptable",
  assurance: "assurance",
};

export function legalDocumentationNicheDir(niche: LegalDocumentationNiche): string {
  return join(LEGAL_DOCUMENTATION_ROOT, NICHE_FOLDER[niche]);
}

export function cgvMarkdownPath(niche: LegalDocumentationNiche): string {
  return join(legalDocumentationNicheDir(niche), "cgv.md");
}

/** Unified CGV source (DEC · IAS · CIF sections). */
export function getSharedCvgMarkdownPath(): string {
  return join(LEGAL_DOCUMENTATION_ROOT, "_shared", "cgv.md");
}

export function pricingJsonPath(audience: PricingAudience): string {
  return join(legalDocumentationNicheDir(audience as LegalDocumentationNiche), "pricing.json");
}

export function faqJsonPath(audience: FaqAudience): string {
  return join(legalDocumentationNicheDir(audience), "faq.json");
}

export function jumFaqJsonPath(): string {
  return join(SITE_CONTENT_ROOT, "faq", "jum.json");
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

/** Public tech notes served by /cvg/[doc]. */
export const SITE_TECH_DIR = join(SITE_CONTENT_ROOT, "tech");

/** @deprecated Use SITE_TECH_DIR */
export const TECH_CONTENT_DIR = SITE_TECH_DIR;

/** @deprecated Use SITE_TECH_DIR */
export const LEGACY_TECH_STACK_DOC_DIR = SITE_TECH_DIR;

export const LEGACY_CGV_FILENAMES: Record<LegalDocumentationNiche, string> = {
  agence: "cvg_master.md",
  entreprise: "cvg_entreprise.md",
  comptable: "cvg_comptable.md",
  cif: "cvg_cif.md",
  jum: "cvg_comptable.md",
  assurance: "cvg_assurance.md",
};
