import { readFileSync } from "fs"
import { join } from "path"

const DOC_DIR = join(process.cwd(), "doc/tech-stack")

export type LegalAudience = "agence" | "entreprise" | "comptable"

export const CVG_DOC_FILES = {
  onboarding: "cvg_onboarding.md",
  "site-sync": "cvg_site-sync.md",
  "sla-client": "capacity/03-sla-client.md",
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

export function isCvgDocSlug(value: string): value is CvgDocSlug {
  return value in CVG_DOC_FILES
}

export function getCvgDocMarkdown(slug: CvgDocSlug): string {
  return readDocFile(CVG_DOC_FILES[slug])
}

function cvgFilenameForAudience(audience: LegalAudience): string {
  if (audience === "entreprise") return "cvg_entreprise.md"
  if (audience === "comptable") return "cvg_comptable.md"
  return "cvg_master.md"
}

export function getCvgMarkdown(audience: LegalAudience = "comptable"): string {
  return readDocFile(cvgFilenameForAudience(audience))
}

export function getMentionsLegalesMarkdown(): string {
  return readDocFile("mentions_legales.md")
}

export function getConfidentialiteMarkdown(): string {
  return readDocFile("confidentialite.md")
}

export function isComptableNichePreset(presetId: string): boolean {
  return presetId.includes("comptable")
}

export function getAiReplyKnowledgeMarkdown(audience: LegalAudience = "comptable"): string {
  if (audience === "comptable") {
    return readDocFile("ai-reply-knowledge-comptable.md")
  }
  return readDocFile("ai-reply-knowledge.md")
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
