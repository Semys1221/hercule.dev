import type { Metadata } from "next"

import { HouseHome } from "@/components/site/house/house-home"
import {
  fetchComptableDemandeTeaser,
  fetchComptableDemandesForCarousel,
} from "@/lib/site/comptable/demandes-repo"

export const metadata: Metadata = {
  title: "Hercule — Infrastructure sobre",
  description: "Infrastructure sobre pour ce qui doit tenir dans la durée.",
}

export const revalidate = 60

export default async function Home() {
  const [demandes, teaser] = await Promise.all([
    fetchComptableDemandesForCarousel(),
    fetchComptableDemandeTeaser(),
  ])

  return (
    <main>
      <HouseHome demandes={demandes} teaser={teaser} />
    </main>
  )
}
