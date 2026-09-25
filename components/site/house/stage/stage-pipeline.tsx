"use client"

import { useRef } from "react"

import { AnimatedBeam } from "@/components/ui/animated-beam"
import { cn } from "@/lib/utils"
import { STAGE_TINT, type StageTabId } from "@/components/site/house/stage/stage-tint"
import { StageWindow } from "@/components/site/house/stage/stage-window"

const NODES = ["Signal", "Qualification", "Livraison"] as const

type StagePipelineProps = {
  tabId: StageTabId
  vertical?: boolean
  minimal?: boolean
}

export function StagePipeline({ tabId, vertical, minimal }: StagePipelineProps) {
  const tint = STAGE_TINT[tabId]
  const containerRef = useRef<HTMLDivElement>(null)
  const refs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)]
  const pipelineKey = `pipeline-${tabId}${vertical ? "-v" : ""}${minimal ? "-m" : ""}`

  const content = (
    <div
      ref={containerRef}
      className={cn(
        "relative flex w-full items-center justify-between gap-4",
        vertical && "h-56 flex-col justify-center py-4",
        minimal && "max-w-md",
      )}
    >
      {NODES.map((label, i) => (
        <div
          key={label}
          ref={refs[i]}
          className={cn(
            "z-10 flex size-14 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-background text-center text-[10px] font-medium leading-tight text-foreground shadow-sm md:size-16 md:text-xs",
            !minimal && i === 1 && tint.soft,
          )}
        >
          <span
            className={cn(
              "mb-1 size-2 rounded-full",
              minimal ? "bg-foreground" : i === 1 ? tint.dot : "bg-foreground",
            )}
          />
          {label}
        </div>
      ))}
      <AnimatedBeam
        gradientId={`hercule-beam-${pipelineKey}-0`}
        containerRef={containerRef}
        fromRef={refs[0]}
        toRef={refs[1]}
        gradientStartColor={tint.beamStart}
        gradientStopColor={tint.beamEnd}
      />
      <AnimatedBeam
        gradientId={`hercule-beam-${pipelineKey}-1`}
        containerRef={containerRef}
        fromRef={refs[1]}
        toRef={refs[2]}
        gradientStartColor={tint.beamStart}
        gradientStopColor={tint.beamEnd}
      />
    </div>
  )

  if (minimal) {
    return content
  }

  return <StageWindow title="Pipeline">{content}</StageWindow>
}
