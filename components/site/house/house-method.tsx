"use client"

import dynamic from "next/dynamic"

import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { HouseHeading, HouseSection } from "@/components/site/house/house-section"
import { HouseReveal } from "@/components/site/house/house-reveal"
import { getHouseMethod, type HouseAudience } from "@/lib/site/house-copy"

const StagePipeline = dynamic(
  () => import("@/components/site/house/stage/stage-pipeline").then((m) => m.StagePipeline),
  { loading: () => <Skeleton className="hidden h-56 w-full rounded-xl lg:block" /> },
)

type HouseMethodProps = {
  audience: HouseAudience
}

export function HouseMethod({ audience }: HouseMethodProps) {
  const method = getHouseMethod(audience)

  return (
    <HouseSection id="methode">
      <HouseReveal>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-0">
            <HouseHeading>{method.title}</HouseHeading>
            <div className="mt-12 flex flex-col gap-0">
              {method.steps.map((step, index) => (
                <div key={step.title}>
                  <div className="flex flex-col gap-2 py-6 md:flex-row md:gap-12">
                    <p className="w-32 shrink-0 text-sm font-medium text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <div className="flex flex-col gap-2">
                      <p className="text-lg font-medium text-foreground">{step.title}</p>
                      <p className="text-muted-foreground">{step.body}</p>
                    </div>
                  </div>
                  {index < method.steps.length - 1 ? <Separator /> : null}
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block">
            <StagePipeline tabId="agence" vertical />
          </div>
        </div>
      </HouseReveal>
    </HouseSection>
  )
}
