import type { Metadata } from "next"

import { HouseFaqPage } from "@/components/site/house/house-faq-page"

export const metadata: Metadata = {
  title: "FAQ — Courtage assurance — Hercule",
  description: "Questions fréquentes sur le courtage de projets assurance Hercule.",
}

export default function AssuranceFaqRoute() {
  return (
    <HouseFaqPage
      audience="assurance"
      backHref="/courtier-assurance"
      backLabel="Retour au courtage assurance"
    />
  )
}
