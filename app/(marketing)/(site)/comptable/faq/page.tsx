import type { Metadata } from "next"

import { HouseFaqPage } from "@/components/site/house/house-faq-page"

export const metadata: Metadata = {
  title: "FAQ — Comptable — Hercule",
  description:
    "Questions fréquentes sur le courtage de projets comptables Hercule (BNC, BIC, TNS).",
}

export default function ComptableFaqRoute() {
  return (
    <HouseFaqPage audience="comptable" backHref="/comptable" backLabel="Retour au courtage comptable" />
  )
}
