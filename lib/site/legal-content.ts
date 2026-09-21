import { readFileSync } from "fs"
import { join } from "path"

import { LEGACY_TECH_DIR } from "@/app/(legacy)/content/paths"
import {
  cgvMarkdownPath,
  getSharedCvgMarkdownPath,
  sharedLegalDocPath,
  SITE_TECH_DIR,
  type LegalDocumentationNiche,
} from "@/lib/legacy/legal-documentation/paths"

const DOC_DIR = SITE_TECH_DIR

export type LegalAudience = "agence" | "entreprise" | "comptable" | "cif" | "jum" | "assurance"

export const CVG_DOC_FILES = {
  onboarding: "cvg_onboarding.md",
  "site-sync": "cvg_site-sync.md",
  "sla-client": "sla-client.md",
  "constants-commercial": "constants-commercial.md",
} as const

export type CvgDocSlug = keyof typeof CVG_DOC_FILES

export const CVG_DOC_METADATA: Record<
  CvgDocSlug,
  { title: string; description: string }
> = {
  onboarding: {
    title: "CGV Hercule — Onboarding",
    description: "Résumé et texte checkbox pour l'acceptation des CGV Hercule.",
  },
  "site-sync": {
    title: "Audit alignement site ↔ CGV",
    description: "Checklist d'alignement entre le site marketing et les CGV Hercule.",
  },
  "sla-client": {
    title: "SLA client — Promesses externes",
    description: "Délais et volumes promis aux cabinets partenaires Hercule.",
  },
  "constants-commercial": {
    title: "Constantes commerciales",
    description: "Source de vérité code pour les montants et offer types Hercule comptable.",
  },
}

function readDocFile(filename: string): string {
  return readFileSync(join(DOC_DIR, filename), "utf-8")
}

function readLegacyTechFile(filename: string): string {
  return readFileSync(join(LEGACY_TECH_DIR, filename), "utf-8")
}

export function isCvgDocSlug(value: string): value is CvgDocSlug {
  return value in CVG_DOC_FILES
}

export function getCvgDocMarkdown(slug: CvgDocSlug): string {
  return readDocFile(CVG_DOC_FILES[slug])
}

export function getCvgMarkdown(audience: LegalAudience = "comptable"): string {
  // Canon v2: single shared CGV (sections #dec · #ias · #cif). Niche path kept for fallback.
  try {
    return readFileSync(getSharedCvgMarkdownPath(), "utf-8")
  } catch {
    return readFileSync(cgvMarkdownPath(audience as LegalDocumentationNiche), "utf-8")
  }
}

export function getMentionsLegalesMarkdown(): string {
  return readFileSync(sharedLegalDocPath("mentions"), "utf-8")
}

export function getConfidentialiteMarkdown(): string {
  return readFileSync(sharedLegalDocPath("confidentialite"), "utf-8")
}

export {
  isAssuranceNichePreset,
  isCifNichePreset,
  isComptableNichePreset,
  legalAudienceFromNichePreset,
} from "@/lib/site/niche-preset"

function withPartnerDueDiligence(
  audience: LegalAudience,
  body: string,
): string {
  if (audience !== "comptable" && audience !== "cif" && audience !== "assurance") {
    return body
  }
  const shared = readLegacyTechFile("ai-reply-knowledge-partner-dd-shared.md")
  return `${body.trim()}\n\n${shared.trim()}\n`
}

export function getAiReplyKnowledgeMarkdown(audience: LegalAudience = "comptable"): string {
  if (audience === "comptable") {
    return withPartnerDueDiligence(audience, readLegacyTechFile("ai-reply-knowledge-comptable.md"))
  }
  if (audience === "cif") {
    return withPartnerDueDiligence(audience, readLegacyTechFile("ai-reply-knowledge-cif.md"))
  }
  if (audience === "assurance") {
    return withPartnerDueDiligence(audience, readLegacyTechFile("ai-reply-knowledge-ias.md"))
  }
  if (audience === "jum") {
    return readLegacyTechFile("ai-reply-knowledge-jum.md")
  }
  return readLegacyTechFile("ai-reply-knowledge.md")
}

export function buildLegalKnowledgeMarkdown(audience: LegalAudience = "comptable"): string {
  return [
    "# Legal knowledge (ground truth)",
    "",
    "## Conditions Générales de Vente",
    getCvgMarkdown(audience),
    "",
    "## Mentions légales",
    getMentionsLegalesMarkdown(),
    "",
    "## Politique de confidentialité",
    getConfidentialiteMarkdown(),
  ].join("\n")
}
