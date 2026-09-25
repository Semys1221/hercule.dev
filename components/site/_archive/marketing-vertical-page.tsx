"use client"

import type { ComponentType } from "react"

import { BandeAudit } from "@/components/site/comptable/bande-audit"
import { BandeProjets } from "@/components/site/comptable/bande-projets"
import { BandeStack } from "@/components/site/comptable/bande-stack"
import { BlocGaranties } from "@/components/site/comptable/bloc-garanties"
import { AuditLive } from "@/components/site/comptable/audit-live"
import { GrillePipeline } from "@/components/site/comptable/grille-pipeline"
import { MethodeRadar } from "@/components/site/comptable/methode-radar"
import { PilierMatching } from "@/components/site/comptable/pilier-matching"
import { HouseAtmosphere } from "@/components/site/home/house-atmosphere"
import { marketingPageShellClassName } from "@/lib/site/marketing-layout"
import type { DemandeContrat, DemandeTeaser } from "@/lib/site/demandes-data"
import { getMarketingCopy, type MarketingAudience } from "@/lib/site/marketing-copy"

type MarketingVerticalPageProps = {
  audience: MarketingAudience
  demandes: DemandeContrat[]
  teaser: DemandeTeaser | null
  Navbar: ComponentType
  Footer: ComponentType
  CrmShowcase: ComponentType
}

export function MarketingVerticalPage({
  audience,
  demandes,
  teaser,
  Navbar,
  Footer,
  CrmShowcase,
}: MarketingVerticalPageProps) {
  const copy = getMarketingCopy(audience)

  return (
    <>
      <Navbar />
      <HouseAtmosphere />
      <div className="bg-background">
        <section className="house-archive-section border-b border-border py-16">
          <div className={marketingPageShellClassName()}>
            <h1 className="text-4xl font-medium leading-[1.1] text-balance text-foreground md:text-5xl lg:text-[56px]">
              {copy.hero.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg text-muted-foreground">{copy.hero.subtitle}</p>
          </div>
        </section>

        <section className="house-archive-section relative overflow-hidden bg-background py-24">
          <div className="pointer-events-none relative mx-auto h-[min(52vh,520px)] w-full max-w-[1440px] px-8 md:px-16">
            <div className="absolute inset-x-8 bottom-0 top-8 overflow-hidden rounded-xl border border-border bg-card shadow-lg md:inset-x-16">
              <CrmShowcase />
            </div>
          </div>
        </section>

        <BandeStack audience={audience} />
        <BandeProjets demandes={demandes} teaser={teaser} audience={audience} />
        <PilierMatching audience={audience} />
        <AuditLive audience={audience} />
        <GrillePipeline demandes={demandes} audience={audience} />
        <MethodeRadar audience={audience} />
        <BlocGaranties audience={audience} />
        <BandeAudit audience={audience} />
        <Footer />
      </div>
    </>
  )
}
