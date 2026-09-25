import type { Metadata } from "next"

import { HouseAbout } from "@/components/site/house/house-about"

export const metadata: Metadata = {
  title: "La société Hercule",
  description:
    "Genèse de Hercule, l'équipe et notre courtage de projets B2B pour comptables, courtiers financiers et courtiers en assurance.",
}

export default function AboutPage() {
  return <HouseAbout />
}
