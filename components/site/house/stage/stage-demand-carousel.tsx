"use client"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { STAGE_TINT } from "@/components/site/house/stage/stage-tint"
import { StageWindow } from "@/components/site/house/stage/stage-window"
import { cn } from "@/lib/utils"

export type DemandePreview = {
  id: string
  prestation: string
  secteur: string
  budget: string
}

type StageDemandCarouselProps = {
  demandes: DemandePreview[]
}

export function StageDemandCarousel({ demandes }: StageDemandCarouselProps) {
  const items = demandes.length > 0 ? demandes : []

  if (items.length === 0) {
    return null
  }

  return (
    <Carousel className="w-full">
      <CarouselContent className="-ml-3">
        {items.map((d, index) => {
          const tintKeys = ["comptable", "cif", "assurance", "agence"] as const
          const tint = STAGE_TINT[tintKeys[index % tintKeys.length]]
          return (
            <CarouselItem key={d.id} className="basis-full pl-3 sm:basis-1/2 lg:basis-1/4">
              <StageWindow title="Demande" bodyClassName="p-3">
                <div className="flex flex-col gap-2">
                  <div className={cn("h-1 w-12 rounded-full", tint.dot)} />
                  <p className="text-sm font-medium leading-snug">{d.prestation}</p>
                  <p className="text-xs text-muted-foreground">{d.secteur}</p>
                  <p className="text-xs text-muted-foreground">{d.budget}</p>
                </div>
              </StageWindow>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      {items.length > 1 ? (
        <div className="mt-4 flex justify-end gap-2">
          <CarouselPrevious className="static translate-y-0" />
          <CarouselNext className="static translate-y-0" />
        </div>
      ) : null}
    </Carousel>
  )
}
