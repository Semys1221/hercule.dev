import type { Metadata } from "next"

import { HouseLegalLayout } from "@/components/site/house/house-legal-layout"
import { HouseScrollCvg } from "@/components/site/house/house-scroll-cvg"
import { MarkdownDocument } from "@/components/site/markdown-document"
import { getCvgMarkdown } from "@/lib/site/cvg-content"

export const metadata: Metadata = {
  title: "CGV — Hercule Hubris (CIF) — Hercule",
  description: "Conditions Générales de Vente Hercule — section Hercule Hubris (CIF).",
}

export default function CvgConseilFinancierPage() {
  const content = getCvgMarkdown("cif")
  return (
    <HouseLegalLayout>
      <HouseScrollCvg sectionId="hubris" />
      <MarkdownDocument content={content} />
    </HouseLegalLayout>
  )
}
