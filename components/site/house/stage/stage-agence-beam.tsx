"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"
import { BorderBeam } from "@/components/ui/border-beam"

const StagePipeline = dynamic(
  () => import("@/components/site/house/stage/stage-pipeline").then((m) => m.StagePipeline),
  { loading: () => <Skeleton className="h-[200px] w-full rounded-xl" /> },
)

export function StageAgenceBeam() {
  return (
    <div className="relative overflow-hidden rounded-xl">
      <StagePipeline tabId="agence" />
      <BorderBeam size={120} duration={8} colorFrom="#6ee7b7" colorTo="#059669" />
    </div>
  )
}
