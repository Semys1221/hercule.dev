import type { Metadata } from "next"

import { CifFaqPage } from "@/components/site/cif-faq-page"

export const metadata: Metadata = {
  title: "FAQ — Hercule CIF",
  description: "Questions fréquentes sur le service Hercule pour les cabinets de conseil financier.",
}

export default function ConseilFinancierFaqPage() {
  return <CifFaqPage />
}
