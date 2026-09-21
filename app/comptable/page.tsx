import type { Metadata } from "next"

import { AccueilScene } from "@/components/comptable/scene-accueil"
import {
  fetchComptableDemandeTeaser,
  fetchComptableDemandesForCarousel,
} from "@/lib/comptable/demandes-repo"

export const metadata: Metadata = {
  title: "Courtage de projets comptables BNC/BIC/TNS — Hercule",
  description:
    "Hercule attribue en exclusivité des projets comptables qualifiés (tenue, fiscal, obligations) pour dirigeants TPE, PME et indépendants (BNC, BIC, TNS).",
}

export const revalidate = 60

export default async function ComptablePage() {
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
