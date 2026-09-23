import type { Metadata } from "next"

import { LegalPageShell } from "@/components/site/legal-page-shell"
import { MarkdownDocument } from "@/components/site/markdown-document"
import { ScrollToCvgSection } from "@/components/site/scroll-to-cvg-section"
import { getCvgMarkdown } from "@/lib/site/cvg-content"

export const metadata: Metadata = {
  title: "CGV — Hercule Hubris (CIF) — Hercule",
  description: "Conditions Générales de Vente Hercule — section Hercule Hubris (CIF).",
}

export default function CvgConseilFinancierPage() {
  const content = getCvgMarkdown("cif")
  return (
    <LegalPageShell>
      <ScrollToCvgSection sectionId="hubris" />
      <MarkdownDocument content={content} />
    </LegalPageShell>
  )
}
