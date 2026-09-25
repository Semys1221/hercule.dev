"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"
import { HouseHeading, HouseSection } from "@/components/site/house/house-section"
import { HouseReveal } from "@/components/site/house/house-reveal"
import { getHouseDeepProjects, type HouseAudience } from "@/lib/site/house-copy"
import type { DemandeContrat } from "@/lib/site/demandes-data"

const StageDemandCarousel = dynamic(
  () =>
    import("@/components/site/house/stage/stage-demand-carousel").then((m) => m.StageDemandCarousel),
  { loading: () => <Skeleton className="h-[180px] w-full rounded-xl" /> },
)

type HouseDeepProjectsProps = {
  audience: HouseAudience
  demandes: DemandeContrat[]
}

export function HouseDeepProjects({ audience, demandes }: HouseDeepProjectsProps) {
  const copy = getHouseDeepProjects(audience)
  const previews = demandes.slice(0, 8).map((d) => ({
    id: d.id,
    prestation: d.prestation,
    secteur: d.secteur,
    budget: d.budget,
  }))

  return (
    <HouseSection id="missions" variant="muted">
      <HouseReveal>
        <HouseHeading>{copy.title}</HouseHeading>
        <p className="mt-4 max-w-2xl text-muted-foreground">{copy.body}</p>
        <div className="mt-12">
          <StageDemandCarousel demandes={previews} />
        </div>
      </HouseReveal>
    </HouseSection>
  )
}
