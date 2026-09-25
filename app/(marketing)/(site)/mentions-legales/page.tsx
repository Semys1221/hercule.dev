import type { Metadata } from "next"

import { HouseLegalLayout } from "@/components/site/house/house-legal-layout"
import { MarkdownDocument } from "@/components/site/markdown-document"
import { getMentionsLegalesMarkdown } from "@/lib/site/legal-content"

export const metadata: Metadata = {
  title: "Mentions légales — Hercule",
  description: "Informations légales et éditoriales du site Hercule.",
}

export default function MentionsLegalesPage() {
  return (
    <HouseLegalLayout>
      <MarkdownDocument content={getMentionsLegalesMarkdown()} />
    </HouseLegalLayout>
  )
}
