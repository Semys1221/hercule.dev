import type { Metadata } from "next"

import { LegalPageShell } from "@/components/site/legal-page-shell"
import { MarkdownDocument } from "@/components/site/markdown-document"
import { getConfidentialiteMarkdown } from "@/lib/site/legal-content"

export const metadata: Metadata = {
  title: "Politique de confidentialité — Hercule",
  description: "Politique de confidentialité et protection des données personnelles — Hercule.",
}

export default function ConfidentialitePage() {
  return (
    <LegalPageShell>
      <MarkdownDocument content={getConfidentialiteMarkdown()} />
    </LegalPageShell>
  )
}
