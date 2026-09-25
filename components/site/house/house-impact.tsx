"use client"

import dynamic from "next/dynamic"

import { NumberTicker } from "@/components/ui/number-ticker"
import { HouseHeading, HouseSection } from "@/components/site/house/house-section"
import { HouseReveal } from "@/components/site/house/house-reveal"
import { StageWindow } from "@/components/site/house/stage/stage-window"
import { STAGE_TINT } from "@/components/site/house/stage/stage-tint"
import { getHouseImpact, type HouseAudience } from "@/lib/site/house-copy"

const StageSparkline = dynamic(
  () => import("@/components/site/house/stage/stage-sparkline").then((m) => m.StageSparkline),
  { ssr: false },
)

const SPARK_COLORS = [STAGE_TINT.comptable.fill, "#0a0a0a", "#a1a1aa"]

type HouseImpactProps = {
  audience: HouseAudience
}

export function HouseImpact({ audience }: HouseImpactProps) {
  const impact = getHouseImpact(audience)

  return (
    <HouseSection variant="muted">
      <HouseReveal>
        <HouseHeading>{impact.title}</HouseHeading>
        <StageWindow className="mt-12">
          <div className="grid gap-8 md:grid-cols-3">
            {impact.stats.map((stat, index) => (
              <div key={stat.label} className="flex flex-col gap-3">
                <p className="text-4xl font-medium tracking-tight tabular-nums">
                  <NumberTicker value={stat.value} />
                  {stat.suffix}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <StageSparkline color={SPARK_COLORS[index % SPARK_COLORS.length]} />
              </div>
            ))}
          </div>
        </StageWindow>
      </HouseReveal>
    </HouseSection>
  )
}
