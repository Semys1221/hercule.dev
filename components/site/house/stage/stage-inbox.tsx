"use client"

import { Badge } from "@/components/ui/badge"
import { AnimatedList } from "@/components/ui/animated-list"
import { cn } from "@/lib/utils"
import { STAGE_TINT, type StageTabId } from "@/components/site/house/stage/stage-tint"
import { StageWindow } from "@/components/site/house/stage/stage-window"

const INBOX_ROWS = [
  { title: "Reprise tenue", meta: "Qualifié · zone nord" },
  { title: "Mission fiscale", meta: "En cours de cadrage" },
  { title: "Transmission dossier", meta: "Attribué" },
] as const

type StageInboxProps = {
  tabId: StageTabId
  compact?: boolean
  bare?: boolean
}

export function StageInbox({ tabId, compact, bare }: StageInboxProps) {
  const tint = STAGE_TINT[tabId]

  const list = (
    <AnimatedList delay={2200} className="flex flex-col gap-2">
        {INBOX_ROWS.map((row) => (
          <div
            key={row.title}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5",
              tint.soft,
            )}
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">{row.title}</span>
              <span className="truncate text-xs text-muted-foreground">{row.meta}</span>
            </div>
            <Badge variant="secondary" className={cn("shrink-0", tint.text)}>
              <span className={cn("mr-1.5 inline-block size-1.5 rounded-full", tint.dot)} />
              Live
            </Badge>
          </div>
        ))}
    </AnimatedList>
  )

  if (bare) {
    return list
  }

  return (
    <StageWindow title="Flux entrants" bodyClassName={compact ? "p-3" : undefined}>
      {list}
    </StageWindow>
  )
}
