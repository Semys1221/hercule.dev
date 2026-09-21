import type { Metadata } from "next"

import { LegalPageShell } from "@/components/site/legal-page-shell"
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
    <LegalPageShell>
      <nav className="mb-8 flex flex-wrap gap-3 text-sm">
        <a href="#dec" className="text-zinc-300 underline underline-offset-2 hover:text-white">
          DEC — Mercantile
        </a>
        <a
          href="#hubris"
          className="text-zinc-300 underline underline-offset-2 hover:text-white"
        >
          Hercule Hubris — IAS + CIF
        </a>
      </nav>
      <MarkdownDocument content={content} />
    </LegalPageShell>
  )
}
