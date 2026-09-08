import type { Metadata } from "next"

import { AccueilScene } from "@/components/agence/scene-accueil"
import {
  fetchDemandeTeaser,
  fetchDemandesForCarousel,
} from "@/lib/agence/demandes-repo"

export const metadata: Metadata = {
  title: "Apports d'affaires agences web — Hercule",
  description:
    "Nous trouvons les bonnes agences pour nos demandes de clients — apports d'affaires qualifiés et audit de compatibilité.",
}

export const revalidate = 60

export default async function AgencePage() {
  const [demandes, teaser] = await Promise.all([
    fetchDemandesForCarousel(),
    fetchDemandeTeaser(),
  ])

  return (
    <main>
      <AccueilScene demandes={demandes} teaser={teaser} />
    </main>
  )
}
