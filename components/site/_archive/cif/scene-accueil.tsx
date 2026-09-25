"use client"

import dynamic from "next/dynamic"

import { MarketingVerticalNavbar } from "@/components/site/marketing-vertical-navbar"
import { MarketingVerticalPage } from "@/components/site/marketing-vertical-page"
import { Footer } from "@/components/site/cif/footer"
import type { DemandeContrat, DemandeTeaser } from "@/lib/site/demandes-data"

const CifCrmShowcase = dynamic(
  () => import("./apercu-crm").then((mod) => mod.ApercuCrm),
  { ssr: false },
)

function CifNavbar() {
  return <MarketingVerticalNavbar faqHref="/conseil-financier/faq" />
}

interface AccueilSceneProps {
  demandes: DemandeContrat[]
  teaser: DemandeTeaser | null
}

export function AccueilScene({ demandes, teaser }: AccueilSceneProps) {
  return (
    <MarketingVerticalPage
      audience="cif"
      demandes={demandes}
      teaser={teaser}
      Navbar={CifNavbar}
      Footer={Footer}
      CrmShowcase={CifCrmShowcase}
    />
  )
}
