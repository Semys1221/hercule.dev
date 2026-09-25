"use client"

import { MarketingVerticalNavbar } from "@/components/site/marketing-vertical-navbar"
import { MarketingVerticalPage } from "@/components/site/marketing-vertical-page"
import { Footer } from "@/components/site/courtier-assurance/footer"
import type { DemandeContrat, DemandeTeaser } from "@/lib/site/demandes-data"

function AssuranceNavbar() {
  return <MarketingVerticalNavbar faqHref="/courtier-assurance/faq" />
}

interface AccueilSceneProps {
  demandes: DemandeContrat[]
  teaser: DemandeTeaser | null
}

export function AccueilScene({ demandes, teaser }: AccueilSceneProps) {
  return (
    <MarketingVerticalPage
      audience="assurance"
      demandes={demandes}
      teaser={teaser}
      Navbar={AssuranceNavbar}
      Footer={Footer}
      CrmShowcase={() => null}
    />
  )
}
