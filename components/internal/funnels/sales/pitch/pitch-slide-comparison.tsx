"use client";

import { memo } from "react";

import {
  FOUNDATION_COMPARISON_ROWS,
} from "@/lib/admin/funnels/comptable-sales-copy";
import { CIF_FOUNDATION_COMPARISON_ROWS } from "@/lib/admin/funnels/cif-sales-copy";
import { isCabinetBuyerSalesAudience, isCifSalesAudience } from "@/lib/admin/funnels/sales-audience";

import { PitchBuyInSlide, VersusRow } from "./pitch-primitives";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

export const PitchSlideComparison = memo(function PitchSlideComparison({
  audience,
  form,
}: PitchSlideBaseProps) {
  const rows = isCifSalesAudience(audience)
    ? CIF_FOUNDATION_COMPARISON_ROWS
    : FOUNDATION_COMPARISON_ROWS;
  const buyInPrompt = isCabinetBuyerSalesAudience(audience)
    ? "Ça fait sens pour le cabinet ?"
    : "Ça fait sens ?";

  return (
    <PitchBuyInSlide
      form={form}
      fieldName="p5BuyIn"
      buyInPrompt={buyInPrompt}
      content={
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <VersusRow
              key={row.criterion}
              criterion={row.criterion}
              loser={row.seo}
              winner={row.foundation}
            />
          ))}
        </div>
      }
    />
  );
});
