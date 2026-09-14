import type { Metadata } from "next"

import { AccueilScene } from "@/components/agence/scene-accueil"
import {
  fetchDemandeTeaser,
  fetchDemandesForCarousel,
} from "@/lib/agence/demandes-repo"

export const metadata: Metadata = {
  title: "Acquérir le système Hercule — Agences web",
  description:
    "Déployez le système inbound Hercule pour votre agence : capture brandée, qualification et routage exclusif des flux B2B.",
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
