import type { Metadata } from "next"

import { LegalPageShell } from "@/components/site/legal-page-shell"
import { MarkdownDocument } from "@/components/site/markdown-document"
import { getCvgMarkdown } from "@/lib/site/cvg-content"

export const metadata: Metadata = {
  title: "Conditions Générales de Vente — Hercule Comptable",
  description: "Conditions Générales de Vente du service Hercule pour les cabinets d'expertise comptable.",
}

export default function CvgComptablePage() {
  const content = getCvgMarkdown("comptable")

  return (
    <LegalPageShell>
      <MarkdownDocument content={content} />
    </LegalPageShell>
  )
}
