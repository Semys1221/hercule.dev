import type { Metadata } from "next"

import { HouseLegalLayout } from "@/components/site/house/house-legal-layout"
import { HouseScrollCvg } from "@/components/site/house/house-scroll-cvg"
import { MarkdownDocument } from "@/components/site/markdown-document"
import { getCvgMarkdown } from "@/lib/site/cvg-content"

export const metadata: Metadata = {
  title: "CGV — Hercule Mercantile (DEC) — Hercule",
  description: "Conditions Générales de Vente Hercule — section DEC Mercantile.",
}

export default function CvgComptablePage() {
  const content = getCvgMarkdown("comptable")
  return (
    <HouseLegalLayout>
      <HouseScrollCvg sectionId="dec" />
      <MarkdownDocument content={content} />
    </HouseLegalLayout>
  )
}
