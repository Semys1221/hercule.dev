import type { Metadata } from "next"

import { HouseAgencePage } from "@/components/site/house/house-agence-page"

export const metadata: Metadata = {
  title: "Agence — Hercule",
  description: "Partenaires agence : qualification et routage des projets Hercule.",
}

export default function AgencePage() {
  return <HouseAgencePage />
}
