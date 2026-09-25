"use client"

import { STAGE_TINT, type StageTabId } from "@/components/site/house/stage/stage-tint"
import { StageWindow } from "@/components/site/house/stage/stage-window"
import { cn } from "@/lib/utils"

type StageMeterProps = {
  tabId: StageTabId
  value?: number
  label?: string
  bare?: boolean
}

export function StageMeter({ tabId, value = 72, label = "Qualification", bare }: StageMeterProps) {
  const tint = STAGE_TINT[tabId]

  const inner = (
    <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className={cn("text-2xl font-medium tabular-nums", tint.text)}>{value}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", tint.dot)}
            style={{ width: `${value}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Besoin, périmètre et compatibilité avant mise en relation.
        </p>
    </div>
  )

  if (bare) {
    return inner
  }

  return <StageWindow title="Score de cadrage">{inner}</StageWindow>
}
