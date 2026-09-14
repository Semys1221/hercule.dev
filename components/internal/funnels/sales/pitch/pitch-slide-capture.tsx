"use client";

import { ArrowDownRight, Map, Radio, Scan, UserRound } from "lucide-react";
import { memo } from "react";

import {
  FOUNDATION_COMPARISON_ROWS,
  FOUNDATION_MECHANISM_BLOCKS,
} from "@/lib/admin/funnels/comptable-sales-copy";
import {
  CIF_FOUNDATION_COMPARISON_ROWS,
  CIF_FOUNDATION_MECHANISM_BLOCKS,
} from "@/lib/admin/funnels/cif-sales-copy";
import { formatPitchWizardInterpolation } from "@/lib/admin/funnels/sales-pitch-wizard";
import { isCabinetBuyerSalesAudience, isCifSalesAudience } from "@/lib/admin/funnels/sales-audience";
import { Badge } from "@/components/ui/badge";

import { FlowNode, PitchBuyInSlide, VersusRow } from "./pitch-primitives";
import { PitchTriptych } from "./pitch-triptych";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

const BLOCK_ICONS = [Scan, Map, Radio, UserRound] as const;

export const PitchSlideCapture = memo(function PitchSlideCapture({
  slide,
  audience,
  form,
  values,
  context,
}: PitchSlideBaseProps) {
  const interpolate = (template: string) =>
    formatPitchWizardInterpolation(template, values, audience, context);
  const blocks = isCifSalesAudience(audience)
    ? CIF_FOUNDATION_MECHANISM_BLOCKS
    : FOUNDATION_MECHANISM_BLOCKS;
  const rows = isCifSalesAudience(audience)
    ? CIF_FOUNDATION_COMPARISON_ROWS
    : FOUNDATION_COMPARISON_ROWS;
  const heroRow = rows[0];
  const buyInPrompt = isCabinetBuyerSalesAudience(audience)
    ? "Ça fait sens pour le cabinet ?"
    : "Ça fait sens ?";

  return (
    <PitchBuyInSlide
      form={form}
      fieldName="p5BuyIn"
      buyInPrompt={buyInPrompt}
      content={
        <div className="flex flex-col gap-4">
          <PitchTriptych
            stepId={slide.id}
            audience={audience}
            values={values}
            context={context}
          />
          <div className="grid gap-3 grid-cols-2">
            {blocks.map((block, index) => {
              const Icon = BLOCK_ICONS[index] ?? Scan;
              return (
                <FlowNode
                  key={block.id}
                  icon={Icon}
                  title={block.title}
                  subtitle={block.description.split("—")[0]?.trim()}
                />
              );
            })}
          </div>
          {heroRow ? (
            <VersusRow
              criterion={heroRow.criterion}
              loser={heroRow.seo}
              winner={heroRow.foundation}
            />
          ) : null}
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <ArrowDownRight className="size-4" aria-hidden />
            <Badge variant="outline" className="max-w-full truncate">
              {interpolate("{cause}")}
            </Badge>
          </div>
        </div>
      }
    />
  );
});
