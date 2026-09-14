import type { Metadata } from "next"

import { AccueilScene } from "@/components/cif/scene-accueil"
import {
  fetchCifDemandeTeaser,
  fetchCifDemandesForCarousel,
} from "@/lib/cif/demandes-repo"

export const metadata: Metadata = {
  title: "Proposer votre cabinet CIF — Hercule",
  description:
    "Hercule reçoit des demandes de dirigeants PME en optimisation fiscale et trésorerie. Les missions sont attribuées en exclusivité aux cabinets CIF / CGP partenaires éligibles.",
}

export const revalidate = 60

export default async function ConseilFinancierPage() {
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
