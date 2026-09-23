import type { Metadata } from "next"

import { AccueilScene } from "@/components/site/courtier-assurance/scene-accueil"
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
      <AccueilScene demandes={demandes} teaser={teaser} />
    </main>
  )
}
