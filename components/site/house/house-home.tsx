import { HouseClosing } from "@/components/site/house/house-closing"
import { HouseDeepAgence } from "@/components/site/house/house-deep-agence"
import { HouseDeepCourtage } from "@/components/site/house/house-deep-courtage"
import { HouseDeepProjects } from "@/components/site/house/house-deep-projects"
import { HouseDualCards } from "@/components/site/house/house-dual-cards"
import { HouseFooter } from "@/components/site/house/house-footer"
import { HouseGuarantees } from "@/components/site/house/house-guarantees"
import { HouseHero } from "@/components/site/house/house-hero"
import { HouseImpact } from "@/components/site/house/house-impact"
import { HouseLogoMarquee } from "@/components/site/house/house-logo-marquee"
import { HouseMethod } from "@/components/site/house/house-method"
import { HouseNav } from "@/components/site/house/house-nav"
import { HouseProductTabs } from "@/components/site/house/house-product-tabs"
import { HouseUpdates } from "@/components/site/house/house-updates"
import type { HouseAudience } from "@/lib/site/house-copy"
import type { DemandeContrat, DemandeTeaser } from "@/lib/site/demandes-data"

type HouseHomeProps = {
  audience?: HouseAudience
  defaultTab?: string
  demandes: DemandeContrat[]
  teaser: DemandeTeaser | null
}

export function HouseHome({
  audience = "home",
  defaultTab,
  demandes,
}: HouseHomeProps) {
  const tab =
    defaultTab ??
    (audience === "cif"
      ? "cif"
      : audience === "comptable"
        ? "comptable"
        : audience === "assurance"
          ? "assurance"
          : audience === "agence"
            ? "agence"
            : audience === "entreprise"
              ? "entreprise"
              : "comptable")

  return (
    <>
      <HouseNav />
      <HouseHero audience={audience} />
      <HouseProductTabs audience={audience} defaultTab={tab} />
      <HouseLogoMarquee audience={audience} />
      <HouseDualCards audience={audience} />
      <HouseDeepCourtage audience={audience} />
      <HouseDeepProjects audience={audience} demandes={demandes} />
      <HouseDeepAgence audience={audience} />
      <HouseImpact audience={audience} />
      <HouseMethod audience={audience} />
      <HouseGuarantees audience={audience} />
      <HouseUpdates audience={audience} />
      <HouseClosing />
      <HouseFooter audience={audience} />
    </>
  )
}
