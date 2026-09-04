import { Hero3DStage } from "@/components/agence/hero-3d-stage"
import {
  countAvailableDemandes,
  fetchDemandeTeaser,
  fetchDemandesForCarousel,
} from "@/lib/agence/demandes-repo"

export const revalidate = 60

export default async function Home() {
  const [demandes, teaser, availableCount] = await Promise.all([
    fetchDemandesForCarousel(),
    fetchDemandeTeaser(),
    countAvailableDemandes(),
  ])

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
