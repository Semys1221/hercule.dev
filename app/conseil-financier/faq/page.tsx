import type { Metadata } from "next"

import { CifFaqPage } from "@/components/site/cif-faq-page"

export const metadata: Metadata = {
  title: "FAQ — Courtier financier — Hercule",
  description:
    "Questions fréquentes sur le courtage de projets patrimoniaux Hercule pour cabinets CIF / CGP (BNC, BIC, TNS).",
}

export default function ConseilFinancierFaqPage() {
  return <CifFaqPage />
}
