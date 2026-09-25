"use client"

import Link from "next/link"

import { BandeAudit } from "@/components/site/comptable/bande-audit"
import { BandeProjets } from "@/components/site/comptable/bande-projets"
import { BandeStack } from "@/components/site/comptable/bande-stack"
import { BlocGaranties } from "@/components/site/comptable/bloc-garanties"
import { AuditLive } from "@/components/site/comptable/audit-live"
import { GrillePipeline } from "@/components/site/comptable/grille-pipeline"
import { MethodeRadar } from "@/components/site/comptable/methode-radar"
import { PilierMatching } from "@/components/site/comptable/pilier-matching"
import { Footer } from "@/components/site/home/footer"
import { HomeCrmShowcase } from "@/components/site/home/home-crm-showcase"
import { marketingPageShellClassName } from "@/lib/site/marketing-layout"
import type { DemandeContrat, DemandeTeaser } from "@/lib/site/demandes-data"
import { CALENDLY_CIF_CONFERENCE_URL } from "@/lib/constants"
import {
  getMarketingCopy,
  HERO_CTA_COMPTABLE,
  HERO_CTA_CONFERENCE,
  HERO_CTA_COURTIER_ASSURANCE,
  HERO_CTA_COURTIER_FINANCIER,
  HERO_EVENT_DATE,
  HERO_EVENT_SUBLINE,
} from "@/lib/site/marketing-copy"

const ARCHIVE_ROUTES = [
  { href: "/conseil-financier", label: HERO_CTA_COURTIER_FINANCIER },
  { href: "/comptable", label: HERO_CTA_COMPTABLE },
  { href: "/courtier-assurance", label: HERO_CTA_COURTIER_ASSURANCE },
  { href: "/agence", label: "Agence" },
  { href: "/entreprise", label: "Entreprise" },
  { href: "/conference/inscription", label: HERO_CTA_CONFERENCE },
] as const

type HomeAccueilArchiveProps = {
  demandes: DemandeContrat[]
  teaser: DemandeTeaser | null
}

export function HomeAccueilArchive({ demandes, teaser }: HomeAccueilArchiveProps) {
  const copy = getMarketingCopy("generic")

  return (
    <div className="bg-background">
      <section className="house-archive-section border-b border-border py-16">
        <div className={marketingPageShellClassName()}>
          <h1 className="text-4xl font-medium leading-[1.1] text-balance text-foreground md:text-5xl lg:text-[56px]">
            {copy.hero.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-muted-foreground">{copy.hero.subtitle}</p>

          <nav className="mt-10 flex flex-col gap-4" aria-label="Rubriques">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {ARCHIVE_ROUTES.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              {HERO_EVENT_DATE} — {HERO_EVENT_SUBLINE}{" "}
              <Link
                href={CALENDLY_CIF_CONFERENCE_URL}
                className="text-foreground underline-offset-4 hover:underline"
              >
                {HERO_CTA_CONFERENCE}
              </Link>
            </p>
          </nav>
        </div>
      </section>

      <HomeCrmShowcase />
      <BandeStack audience="generic" />
      <BandeProjets demandes={demandes} teaser={teaser} audience="generic" />
      <PilierMatching audience="generic" />
      <AuditLive audience="generic" />
      <GrillePipeline demandes={demandes} audience="generic" />
      <MethodeRadar audience="generic" />
      <BlocGaranties audience="generic" />
      <BandeAudit audience="generic" />
      <Footer />
    </div>
  )
}
