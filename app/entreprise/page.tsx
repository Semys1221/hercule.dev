import type { Metadata } from "next"
import { HeroStage } from "@/components/entreprise/hero-stage"

export const metadata: Metadata = {
  title: "Trouver une agence — Hercule",
  description:
    "Service gratuit de matching B2B. Décrivez votre besoin, Hercule qualifie votre projet et sélectionne les agences adaptées.",
}

export default function EntreprisePage() {
  return (
    <main>
      <HeroStage />
    </main>
  )
}
