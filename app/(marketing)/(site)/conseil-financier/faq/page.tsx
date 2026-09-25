import type { Metadata } from "next"

import { HouseFaqPage } from "@/components/site/house/house-faq-page"

export const metadata: Metadata = {
  title: "FAQ — Conseil financier — Hercule",
  description: "Questions fréquentes sur le courtage de projets patrimoniaux Hercule.",
}

export default function CifFaqRoute() {
  return (
    <HouseFaqPage
      audience="cif"
      backHref="/conseil-financier"
      backLabel="Retour au conseil financier"
    />
  )
}
