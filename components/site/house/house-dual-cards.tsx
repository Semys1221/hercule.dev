"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { HouseHeading, HouseSection } from "@/components/site/house/house-section"
import { HouseReveal } from "@/components/site/house/house-reveal"
import { StageInbox } from "@/components/site/house/stage/stage-inbox"
import { StageMeter } from "@/components/site/house/stage/stage-meter"
import { StageWindow } from "@/components/site/house/stage/stage-window"
import { getHouseDual, type HouseAudience } from "@/lib/site/house-copy"

type HouseDualCardsProps = {
  audience: HouseAudience
}

export function HouseDualCards({ audience }: HouseDualCardsProps) {
  const dual = getHouseDual(audience)

  return (
    <HouseSection>
      <HouseReveal>
        <HouseHeading>{dual.heading}</HouseHeading>
        <div className="mt-12 grid gap-4 md:grid-cols-2 md:grid-rows-2">
          <div className="flex flex-col gap-4 md:row-span-2">
            <div className="flex flex-col gap-2">
              <p className="text-lg font-medium text-foreground">{dual.cabinets.title}</p>
              <p className="text-muted-foreground">{dual.cabinets.body}</p>
              <Button variant="link" className="h-auto w-fit p-0" asChild>
                <Link href={dual.cabinets.href}>En savoir plus</Link>
              </Button>
            </div>
            <StageInbox tabId="comptable" />
          </div>
          <StageWindow title={dual.entreprises.title} className="md:col-start-2">
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">{dual.entreprises.body}</p>
              <StageMeter tabId="entreprise" value={68} label="Alignement" bare />
              <Button variant="link" className="h-auto w-fit p-0" asChild>
                <Link href={dual.entreprises.href}>En savoir plus</Link>
              </Button>
            </div>
          </StageWindow>
        </div>
      </HouseReveal>
    </HouseSection>
  )
}
