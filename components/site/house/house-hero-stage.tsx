"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"

const StageHeroTech = dynamic(
  () => import("@/components/site/house/stage/stage-hero-tech").then((m) => m.StageHeroTech),
  { loading: () => <Skeleton className="h-48 w-full rounded-xl md:h-56" /> },
)

export function HouseHeroStage() {
  return (
    <div className="w-full min-w-0">
      <StageHeroTech />
    </div>
  )
}
