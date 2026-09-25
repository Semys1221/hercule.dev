"use client"

import { Marquee } from "@/components/ui/marquee"
import { HouseEyebrow, HouseSection } from "@/components/site/house/house-section"
import { HouseReveal } from "@/components/site/house/house-reveal"
import { StageTerminal } from "@/components/site/house/stage/stage-terminal"
import { getHouseMarqueeItems, type HouseAudience } from "@/lib/site/house-copy"

type HouseLogoMarqueeProps = {
  audience: HouseAudience
}

export function HouseLogoMarquee({ audience }: HouseLogoMarqueeProps) {
  const items = getHouseMarqueeItems(audience)

  return (
    <HouseSection variant="muted">
      <HouseReveal>
        <HouseEyebrow>Sur le flux</HouseEyebrow>
        <Marquee className="mt-8 [--duration:40s]" pauseOnHover>
          {items.map((label) => (
            <span
              key={label}
              className="mx-8 text-lg font-medium tracking-tight text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </Marquee>
        <StageTerminal labels={items} />
      </HouseReveal>
    </HouseSection>
  )
}
