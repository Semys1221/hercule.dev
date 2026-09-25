"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"
import { HouseHeading, HouseSection } from "@/components/site/house/house-section"
import { HouseReveal } from "@/components/site/house/house-reveal"
import { StageSplit } from "@/components/site/house/stage/stage-split"
import { getHouseDeepCourtage, type HouseAudience } from "@/lib/site/house-copy"

const StageCourtagePanel = dynamic(
  () =>
    import("@/components/site/house/stage/stage-courtage-panel").then((m) => m.StageCourtagePanel),
  { loading: () => <Skeleton className="h-[320px] w-full rounded-xl" /> },
)

type HouseDeepCourtageProps = {
  audience: HouseAudience
}

export function HouseDeepCourtage({ audience }: HouseDeepCourtageProps) {
  const copy = getHouseDeepCourtage(audience)

  return (
    <HouseSection>
      <HouseReveal>
        <StageSplit
          lead={
            <div className="flex flex-col gap-8">
              <HouseHeading>{copy.title}</HouseHeading>
              <div className="flex flex-col gap-6">
                {copy.cards.map((card) => (
                  <div key={card.title} className="flex flex-col gap-1 border-l-2 border-border pl-4">
                    <p className="font-medium text-foreground">{card.title}</p>
                    <p className="text-sm text-muted-foreground">{card.body}</p>
                  </div>
                ))}
              </div>
            </div>
          }
          stage={<StageCourtagePanel />}
        />
      </HouseReveal>
    </HouseSection>
  )
}
