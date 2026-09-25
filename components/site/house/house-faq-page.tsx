import { HouseDocument } from "@/components/site/house/house-document"
import { HouseFaqAccordion } from "@/components/site/house/house-faq-accordion"
import type { FaqAudience } from "@/lib/site/faq-types"
import type { HouseAudience } from "@/lib/site/house-copy"

const FAQ_TO_HOUSE: Record<FaqAudience, HouseAudience> = {
  comptable: "comptable",
  cif: "cif",
  assurance: "assurance",
  agence: "agence",
  entreprise: "entreprise",
  comptable_delivery: "comptable",
}

type HouseFaqPageProps = {
  audience: FaqAudience
  backHref: string
  backLabel: string
}

export function HouseFaqPage({ audience, backHref, backLabel }: HouseFaqPageProps) {
  const heroAudience = FAQ_TO_HOUSE[audience] ?? "home"

  return (
    <HouseDocument audience={heroAudience} backHref={backHref} backLabel={backLabel}>
      <HouseFaqAccordion audience={audience} />
    </HouseDocument>
  )
}
