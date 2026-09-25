import type { Metadata } from "next"

import { HouseFaqHub } from "@/components/site/house/house-faq-hub"

export const metadata: Metadata = {
  title: "FAQ — Courtage de projets B2B — Hercule",
  description:
    "Questions fréquentes sur le courtage de projets Hercule pour comptables, courtiers financiers et courtiers en assurance.",
}

export default function FaqPage() {
  return <HouseFaqHub />
}
