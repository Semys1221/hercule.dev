import { AccueilScene } from "@/components/agence/scene-accueil"
import {
  fetchDemandeTeaser,
  fetchDemandesForCarousel,
} from "@/lib/agence/demandes-repo"

export const revalidate = 60

export default async function Home() {
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
