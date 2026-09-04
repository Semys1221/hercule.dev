import { Hero3DStage } from "@/components/agence/hero-3d-stage"
import {
  countAvailableDemandes,
  fetchDemandeTeaser,
  fetchDemandesForCarousel,
} from "@/lib/agence/demandes-repo"
import { getDemandesVisibles } from "@/lib/demandes-data"

export const revalidate = 60

export default async function Home() {
  const [allDemandes, teaser, availableCount] = await Promise.all([
    fetchDemandesForCarousel(),
    fetchDemandeTeaser(),
    countAvailableDemandes(),
  ])

  const demandes = getDemandesVisibles(allDemandes)

  return (
    <main>
      <Hero3DStage
        demandes={demandes}
        teaser={teaser}
        availableCount={availableCount}
      />
    </main>
  )
}
