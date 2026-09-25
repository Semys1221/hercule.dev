"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { HouseHeading, HouseSection } from "@/components/site/house/house-section"
import { HouseReveal } from "@/components/site/house/house-reveal"
import { StageAgenceBeam } from "@/components/site/house/stage/stage-agence-beam"
import { StageSplit } from "@/components/site/house/stage/stage-split"
import { getHouseDeepAgence, type HouseAudience } from "@/lib/site/house-copy"

type HouseDeepAgenceProps = {
  audience: HouseAudience
}

export function HouseDeepAgence({ audience }: HouseDeepAgenceProps) {
  const copy = getHouseDeepAgence(audience)

  return (
    <HouseSection>
      <HouseReveal>
        <StageSplit
          reverse
          lead={
            <div className="flex flex-col gap-6">
              <HouseHeading>{copy.title}</HouseHeading>
              <p className="text-lg text-muted-foreground">{copy.body}</p>
              <Button variant="link" className="h-auto w-fit p-0" asChild>
                <Link href={copy.href}>Page agence</Link>
              </Button>
            </div>
          }
          stage={<StageAgenceBeam />}
        />
      </HouseReveal>
    </HouseSection>
  )
}
