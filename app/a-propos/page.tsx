import type { Metadata } from "next"

import { CompanyAbout } from "@/components/site/company-about"

export const metadata: Metadata = {
  title: "La société Hercule",
  description:
    "Genèse de Hercule, l'équipe et notre mission : qualifier les demandes PME et mettre en relation les cabinets d'expertise comptable.",
}

export default function AboutPage() {
  return <CompanyAbout />
}
