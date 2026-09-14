"use client";

import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import {
  FOUNDATION_FOUNDATION_BLOCKS,
} from "@/lib/admin/funnels/comptable-sales-copy";
import { CIF_FOUNDATION_FOUNDATION_BLOCKS } from "@/lib/admin/funnels/cif-sales-copy";
import { isCabinetBuyerSalesAudience, isCifSalesAudience } from "@/lib/admin/funnels/sales-audience";

import {
  buildFoundationBlocksTimelineSteps,
  SalesPitchHorizontalTimeline,
} from "../sales-foundation-timeline";
import { PitchBuyInSlide } from "./pitch-primitives";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

export const PitchSlideFoundation = memo(function PitchSlideFoundation({
  audience,
  form,
  immersive,
}: PitchSlideBaseProps) {
  const blocks = isCifSalesAudience(audience)
    ? CIF_FOUNDATION_FOUNDATION_BLOCKS
    : FOUNDATION_FOUNDATION_BLOCKS;
  const steps = buildFoundationBlocksTimelineSteps(blocks).map((step) => ({
    ...step,
    items: step.items,
  }));
  const buyInPrompt = isCabinetBuyerSalesAudience(audience)
    ? "Ça fait sens pour le cabinet ?"
    : "Ça fait sens ?";

  return (
    <PitchBuyInSlide
      form={form}
      fieldName="p7FoundationBuyIn"
      buyInPrompt={buyInPrompt}
      content={
        <div className="flex flex-col gap-4">
          <SalesPitchHorizontalTimeline
            immersive={immersive}
            steps={steps}
            activeStatusLabel="Fondations"
          />
          <div className="flex flex-wrap gap-2">
            {blocks.flatMap((block) =>
              block.items.map((item) => (
                <Badge key={`${block.id}-${item}`} variant="secondary">
                  {item}
                </Badge>
              )),
            )}
          </div>
        </div>
      }
    />
  );
});
