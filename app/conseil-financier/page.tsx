import type { Metadata } from "next"

import { AccueilScene } from "@/components/cif/scene-accueil"
import {
  fetchCifDemandeTeaser,
  fetchCifDemandesForCarousel,
} from "@/lib/cif/demandes-repo"

export const metadata: Metadata = {
  title: "Acquérir le système Hercule — Conseil financier",
  description:
    "Déployez le système inbound Hercule sur votre zone : capture brandée, qualification et routage exclusif des flux patrimoniaux vers votre cabinet CIF.",
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
