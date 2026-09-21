import type { Metadata } from "next"

import { ComptableFaqPage } from "@/components/site/comptable-faq-page"

export const metadata: Metadata = {
  title: "FAQ — Comptable — Hercule",
  description:
    "Questions fréquentes sur le courtage de projets comptables Hercule (BNC, BIC, TNS).",
}

export default function ComptableFaqRoute() {
  return <ComptableFaqPage />
}
