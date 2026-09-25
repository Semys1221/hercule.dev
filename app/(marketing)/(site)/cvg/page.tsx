import type { Metadata } from "next"
import Link from "next/link"

import { HouseLegalLayout } from "@/components/site/house/house-legal-layout"
import { MarkdownDocument } from "@/components/site/markdown-document"
import { getCvgMarkdown } from "@/lib/site/cvg-content"

export const metadata: Metadata = {
  title: "Conditions Générales de Vente — Hercule",
  description:
    "CGV Hercule — Hercule Mercantile (DEC) et Hercule Hubris (IAS + CIF).",
}

export default function CvgPage() {
  const content = getCvgMarkdown("comptable")

  return (
    <HouseLegalLayout>
      <nav className="mb-8 flex flex-wrap gap-3 text-sm">
        <Link href="#dec" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          DEC — Mercantile
        </Link>
        <Link
          href="#hubris"
          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Hercule Hubris — IAS + CIF
        </Link>
      </nav>
      <MarkdownDocument content={content} />
    </HouseLegalLayout>
  )
}
