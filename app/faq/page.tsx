import type { Metadata } from "next"

import { ComptableFaqPage } from "@/components/site/comptable-faq-page"

export const metadata: Metadata = {
  title: "FAQ — Hercule Comptable",
  description: "Questions fréquentes sur le service Hercule pour les cabinets d'expertise comptable.",
}

export default function FaqPage() {
  return <ComptableFaqPage />
}
