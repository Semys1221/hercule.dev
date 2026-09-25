import type { Metadata } from "next"

import { HouseHome } from "@/components/site/house/house-home"
import {
  fetchCifDemandeTeaser,
  fetchCifDemandesForCarousel,
} from "@/lib/site/cif/demandes-repo"

export const metadata: Metadata = {
  title: "Courtage de projets prévoyance et assurance — Hercule",
  description:
    "Hercule attribue en exclusivité des projets prévoyance, santé collective et protection sociale (BNC, BIC, TNS) vers votre cabinet de courtage ORIAS.",
}

export const revalidate = 60

export default async function CourtierAssurancePage() {
  const [demandes, teaser] = await Promise.all([
    fetchCifDemandesForCarousel(),
    fetchCifDemandeTeaser(),
  ])

  return (
    <main>
      <HouseHome audience="assurance" defaultTab="assurance" demandes={demandes} teaser={teaser} />
    </main>
  )
}
