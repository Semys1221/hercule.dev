import type { Metadata } from "next"

import { LegalPageShell } from "@/components/site/legal-page-shell"
import { MarkdownDocument } from "@/components/site/markdown-document"
import { ScrollToCvgSection } from "@/components/site/scroll-to-cvg-section"
import { getCvgMarkdown } from "@/lib/site/cvg-content"

export const metadata: Metadata = {
  title: "CGV — Hercule Mercantile (DEC) — Hercule",
  description: "Conditions Générales de Vente Hercule — section DEC Mercantile.",
}

export default function CvgComptablePage() {
  const content = getCvgMarkdown("comptable")
  return (
    <LegalPageShell>
      <ScrollToCvgSection sectionId="dec" />
      <MarkdownDocument content={content} />
    </LegalPageShell>
  )
}
