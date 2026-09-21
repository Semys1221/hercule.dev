import type { Metadata } from "next"

import { AccueilScene } from "@/components/cif/scene-accueil"
import {
  fetchCifDemandeTeaser,
  fetchCifDemandesForCarousel,
} from "@/lib/cif/demandes-repo"

export const metadata: Metadata = {
  title: "Courtage de projets patrimoniaux — Courtier financier — Hercule",
  description:
    "Hercule attribue en exclusivité des projets patrimoniaux qualifiés pour dirigeants TPE, PME et indépendants (BNC, BIC, TNS) vers votre cabinet CIF.",
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
