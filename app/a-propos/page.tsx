import type { Metadata } from "next"

import { CompanyAbout } from "@/components/site/company-about"

export const metadata: Metadata = {
  title: "La société Hercule",
  description:
    "Genèse de Hercule, l'équipe et notre système inbound : infrastructure de capture, qualification et routage exclusif pour cabinets et agences.",
}

export default function AboutPage() {
  return <CompanyAbout />
}
