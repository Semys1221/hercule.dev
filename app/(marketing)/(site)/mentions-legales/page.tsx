import type { Metadata } from "next"

import { LegalPageShell } from "@/components/site/legal-page-shell"
import { MarkdownDocument } from "@/components/site/markdown-document"
import { getMentionsLegalesMarkdown } from "@/lib/site/legal-content"

export const metadata: Metadata = {
  title: "Mentions légales — Hercule",
  description: "Informations légales et éditoriales du site Hercule.",
}

export default function MentionsLegalesPage() {
  return (
    <LegalPageShell>
      <MarkdownDocument content={getMentionsLegalesMarkdown()} />
    </LegalPageShell>
  )
}
