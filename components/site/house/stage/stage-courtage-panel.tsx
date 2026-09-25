"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"
import { StageWindow } from "@/components/site/house/stage/stage-window"
import { StageInbox } from "@/components/site/house/stage/stage-inbox"

const StagePipeline = dynamic(
  () => import("@/components/site/house/stage/stage-pipeline").then((m) => m.StagePipeline),
  { loading: () => <Skeleton className="h-24 w-full rounded-lg" /> },
)

export function StageCourtagePanel() {
  return (
    <StageWindow title="Courtage — aperçu">
      <div className="flex flex-col gap-4">
        <StagePipeline tabId="comptable" minimal />
        <div className="grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Attribués</p>
            <p className="text-lg font-medium">12</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Qualification</p>
            <p className="text-lg font-medium">3</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Zone</p>
            <p className="text-sm font-medium">Verrouillée</p>
          </div>
        </div>
        <StageInbox tabId="comptable" compact bare />
      </div>
    </StageWindow>
  )
}
