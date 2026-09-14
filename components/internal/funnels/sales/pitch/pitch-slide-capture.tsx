"use client";

import { ArrowDownRight, Map, Radio, Scan, UserRound } from "lucide-react";
import { memo } from "react";

import {
  FOUNDATION_MECHANISM_BLOCKS,
} from "@/lib/admin/funnels/comptable-sales-copy";
import { CIF_FOUNDATION_MECHANISM_BLOCKS } from "@/lib/admin/funnels/cif-sales-copy";
import { formatPitchWizardInterpolation } from "@/lib/admin/funnels/sales-pitch-wizard";
import { isCifSalesAudience } from "@/lib/admin/funnels/sales-audience";
import { Badge } from "@/components/ui/badge";

import { FlowNode } from "./pitch-primitives";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

const BLOCK_ICONS = [Scan, Map, Radio, UserRound] as const;

export const PitchSlideCapture = memo(function PitchSlideCapture({
  audience,
  values,
  context,
}: PitchSlideBaseProps) {
  const interpolate = (template: string) =>
    formatPitchWizardInterpolation(template, values, audience, context);
  const blocks = isCifSalesAudience(audience)
    ? CIF_FOUNDATION_MECHANISM_BLOCKS
    : FOUNDATION_MECHANISM_BLOCKS;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {blocks.map((block, index) => {
          const Icon = BLOCK_ICONS[index] ?? Scan;
          const zigzag = index % 2 === 1 ? "sm:translate-y-4" : "";
          return (
            <div key={block.id} className={zigzag}>
              <FlowNode icon={Icon} title={block.title} subtitle={block.description} />
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <ArrowDownRight className="size-4" aria-hidden />
        <Badge variant="outline" className="max-w-full truncate">
          {interpolate("{cause}")}
        </Badge>
      </div>
    </div>
  );
});
