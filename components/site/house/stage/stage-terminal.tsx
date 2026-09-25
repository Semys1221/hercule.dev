"use client"

import { Kbd } from "@/components/ui/kbd"
import { STAGE_TINT } from "@/components/site/house/stage/stage-tint"
import { cn } from "@/lib/utils"

const TINT_CYCLE = ["comptable", "cif", "assurance", "agence", "entreprise"] as const

type StageTerminalProps = {
  labels: readonly string[]
}

export function StageTerminal({ labels }: StageTerminalProps) {
  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-muted/30 px-4 py-3 font-mono text-xs">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {labels.map((label, index) => {
          const tint = STAGE_TINT[TINT_CYCLE[index % TINT_CYCLE.length]]
          return (
            <span key={label} className="inline-flex items-center gap-2 text-muted-foreground">
              <span className={cn("size-1.5 shrink-0 rounded-full", tint.dot)} aria-hidden />
              <Kbd className="bg-background text-[10px]">{label}</Kbd>
            </span>
          )
        })}
      </div>
    </div>
  )
}
