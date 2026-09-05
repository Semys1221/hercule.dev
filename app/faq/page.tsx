import type { Metadata } from "next"

import { AgenceFaqPage } from "@/components/site/agence-faq-page"

export const metadata: Metadata = {
  title: "FAQ — Hercule",
  description: "Questions fréquentes sur le service Hercule pour les agences partenaires.",
}

export default function FaqPage() {
  return <AgenceFaqPage />
}
