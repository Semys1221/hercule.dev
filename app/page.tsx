import type { Metadata } from "next"

import { AccueilScene } from "@/components/comptable/scene-accueil"
import {
  fetchComptableDemandeTeaser,
  fetchComptableDemandesForCarousel,
} from "@/lib/comptable/demandes-repo"

export const metadata: Metadata = {
  title: "Proposer votre cabinet — Hercule",
  description:
    "Hercule reçoit des demandes de dirigeants PME. Les cabinets partenaires éligibles reçoivent ces missions de tenue, fiscales et administratives.",
}

export const revalidate = 60

export default async function Home() {
  const [demandes, teaser] = await Promise.all([
    fetchComptableDemandesForCarousel(),
    fetchComptableDemandeTeaser(),
  ])

  return (
    <main>
      <AccueilScene demandes={demandes} teaser={teaser} />
    </main>
  )
}
