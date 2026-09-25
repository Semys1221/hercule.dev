"use client"

import { StagePipeline } from "@/components/site/house/stage/stage-pipeline"
import { StageWindow } from "@/components/site/house/stage/stage-window"

export function StageHeroPipeline() {
  return (
    <StageWindow title="Flux" className="w-full max-w-lg">
      <StagePipeline tabId="comptable" minimal />
    </StageWindow>
  )
}
