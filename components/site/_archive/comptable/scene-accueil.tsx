"use client"

import dynamic from "next/dynamic"

import { MarketingVerticalNavbar } from "@/components/site/marketing-vertical-navbar"
import { MarketingVerticalPage } from "@/components/site/marketing-vertical-page"
import { Footer } from "@/components/site/comptable/footer"
import type { DemandeContrat, DemandeTeaser } from "@/lib/site/demandes-data"

const ComptableCrmShowcase = dynamic(
  () => import("./apercu-crm").then((mod) => mod.ApercuCrm),
  { ssr: false },
)

function ComptableNavbar() {
  return <MarketingVerticalNavbar faqHref="/comptable/faq" />
}

interface AccueilSceneProps {
  demandes: DemandeContrat[]
  teaser: DemandeTeaser | null
}

export function AccueilScene({ demandes, teaser }: AccueilSceneProps) {
  return (
    <MarketingVerticalPage
      audience="comptable"
      demandes={demandes}
      teaser={teaser}
      Navbar={ComptableNavbar}
      Footer={Footer}
      CrmShowcase={ComptableCrmShowcase}
    />
  )
}
