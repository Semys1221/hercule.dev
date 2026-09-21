import type { Metadata } from "next"

import { AccueilScene } from "@/components/site/home/scene-accueil"
import {
  fetchComptableDemandeTeaser,
  fetchComptableDemandesForCarousel,
} from "@/lib/site/comptable/demandes-repo"

export const metadata: Metadata = {
  title: "Hercule — Courtage de projets B2B",
  description:
    "Attribution exclusive de projets qualifiés (BNC, BIC, TNS) pour comptables, courtiers financiers et courtiers en assurance.",
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
