import type { Metadata } from "next"

import { CompanyAbout } from "@/components/site/company-about"

export const metadata: Metadata = {
  title: "La société Hercule",
  description:
    "Genèse de Hercule, l'équipe et notre mission : qualifier les agences et mettre en relation les demandes clients.",
}

export default function AboutPage() {
  return <CompanyAbout />
}
