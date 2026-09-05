import { readFileSync } from "fs"
import { join } from "path"

const DOC_DIR = join(process.cwd(), "doc/tech-stack")

export type LegalAudience = "agence" | "entreprise"

function readDocFile(filename: string): string {
  return readFileSync(join(DOC_DIR, filename), "utf-8")
}

export function getCvgMarkdown(audience: LegalAudience = "agence"): string {
  return readDocFile(audience === "entreprise" ? "cvg_entreprise.md" : "cvg_master.md")
}

export function getMentionsLegalesMarkdown(): string {
  return readDocFile("mentions_legales.md")
}

export function getConfidentialiteMarkdown(): string {
  return readDocFile("confidentialite.md")
}

export function getAiReplyKnowledgeMarkdown(): string {
  return readDocFile("ai-reply-knowledge.md")
}

export function buildLegalKnowledgeMarkdown(audience: LegalAudience = "agence"): string {
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
