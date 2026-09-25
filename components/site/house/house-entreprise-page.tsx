import { HouseDocument } from "@/components/site/house/house-document"
import { HouseFaqAccordion } from "@/components/site/house/house-faq-accordion"

export function HouseEntreprisePage() {
  return (
    <HouseDocument audience="entreprise" backHref="/" backLabel="Retour à l'accueil">
      <HouseFaqAccordion audience="entreprise" />
    </HouseDocument>
  )
}
