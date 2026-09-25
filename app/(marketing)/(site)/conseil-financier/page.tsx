import type { Metadata } from "next"

import { HouseHome } from "@/components/site/house/house-home"
import {
  fetchCifDemandeTeaser,
  fetchCifDemandesForCarousel,
} from "@/lib/site/cif/demandes-repo"

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
      <HouseHome audience="cif" defaultTab="cif" demandes={demandes} teaser={teaser} />
    </main>
  )
}
