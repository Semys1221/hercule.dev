"use client"

import { HerculeMark } from "@/components/hercule-mark"
import { OrbitingCircles } from "@/components/ui/orbiting-circles"
import { STAGE_TINT, type StageTabId } from "@/components/site/house/stage/stage-tint"
import { StageWindow } from "@/components/site/house/stage/stage-window"
import { cn } from "@/lib/utils"

const ORBIT_LABELS = ["Besoin", "Zone", "Fit"] as const

type StageOrbitProps = {
  tabId: StageTabId
}

export function StageOrbit({ tabId }: StageOrbitProps) {
  const tint = STAGE_TINT[tabId]

  return (
    <StageWindow title="Mise en relation" bodyClassName="flex min-h-[220px] items-center justify-center">
      <div className="relative flex size-52 items-center justify-center md:size-56">
        <div className="z-10 flex size-12 items-center justify-center rounded-full border border-border bg-background shadow-sm">
          <HerculeMark className="size-5 text-foreground" />
        </div>
        <OrbitingCircles radius={72} duration={18} iconSize={28}>
          {ORBIT_LABELS.map((label) => (
            <span
              key={label}
              className={cn(
                "flex size-7 items-center justify-center rounded-full border border-border bg-background text-[9px] font-medium",
                tint.text,
              )}
            >
              {label.slice(0, 1)}
            </span>
          ))}
        </OrbitingCircles>
        <OrbitingCircles radius={48} reverse duration={14} iconSize={22}>
          <span className={cn("size-2 rounded-full", tint.dot)} />
          <span className="size-2 rounded-full bg-muted-foreground/40" />
        </OrbitingCircles>
      </div>
    </StageWindow>
  )
}
