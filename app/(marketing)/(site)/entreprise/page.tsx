import type { Metadata } from "next"

import { HouseEntreprisePage } from "@/components/site/house/house-entreprise-page"

export const metadata: Metadata = {
  title: "Entreprise — Hercule",
  description: "Dirigeants TPE, PME et ETI : être mis en relation avec un cabinet compatible.",
}

export default function EntreprisePageRoute() {
  return <HouseEntreprisePage />
}
