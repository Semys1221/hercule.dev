"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"
import { StageInbox } from "@/components/site/house/stage/stage-inbox"
import { StageMeter } from "@/components/site/house/stage/stage-meter"
import { StageOrbit } from "@/components/site/house/stage/stage-orbit"
import { isStageTabId, type StageTabId } from "@/components/site/house/stage/stage-tint"

const StageChart = dynamic(
  () => import("@/components/site/house/stage/stage-chart").then((m) => m.StageChart),
  { loading: () => <Skeleton className="h-[220px] w-full rounded-xl" /> },
)

const StagePipeline = dynamic(
  () => import("@/components/site/house/stage/stage-pipeline").then((m) => m.StagePipeline),
  { loading: () => <Skeleton className="h-[220px] w-full rounded-xl" /> },
)

type StageTabSceneProps = {
  tabId: string
}

export function StageTabScene({ tabId }: StageTabSceneProps) {
  if (!isStageTabId(tabId)) {
    return <StageInbox tabId="comptable" />
  }

  const id: StageTabId = tabId

  switch (id) {
    case "comptable":
      return <StageInbox tabId={id} />
    case "cif":
      return <StageChart tabId={id} />
    case "assurance":
      return <StageMeter tabId={id} />
    case "agence":
      return <StagePipeline tabId={id} />
    case "entreprise":
      return <StageOrbit tabId={id} />
    default:
      return <StageInbox tabId="comptable" />
  }
}
