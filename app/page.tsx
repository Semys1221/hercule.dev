import type { Metadata } from "next"

import { AccueilScene } from "@/components/comptable/scene-accueil"
import {
  fetchComptableDemandeTeaser,
  fetchComptableDemandesForCarousel,
} from "@/lib/comptable/demandes-repo"

export const metadata: Metadata = {
  title: "Acquérir le système Hercule — Expertise comptable",
  description:
    "Déployez le système inbound Hercule sur votre zone : capture brandée, qualification et routage exclusif des flux PME vers votre cabinet.",
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
