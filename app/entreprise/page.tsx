import type { Metadata } from "next"
import { AccueilScene } from "@/components/entreprise/scene-accueil"

export const metadata: Metadata = {
  title: "Proposer votre cabinet — Hercule",
  description:
    "Hercule reçoit des demandes d'indépendants et de dirigeants de TPE. Les cabinets partenaires éligibles reçoivent ces missions de tenue, fiscales et administratives.",
}

export default function EntreprisePage() {
  return (
    <main>
      <AccueilScene />
    </main>
  )
}
