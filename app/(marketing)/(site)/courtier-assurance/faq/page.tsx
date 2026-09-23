import type { Metadata } from "next"

import { AssuranceFaqPage } from "@/components/site/assurance-faq-page"

export const metadata: Metadata = {
  title: "FAQ — Courtier en assurance — Hercule",
  description:
    "Questions fréquentes sur le courtage de projets prévoyance et assurance Hercule (BNC, BIC, TNS).",
}

export default function CourtierAssuranceFaqPage() {
  return <AssuranceFaqPage />
}
