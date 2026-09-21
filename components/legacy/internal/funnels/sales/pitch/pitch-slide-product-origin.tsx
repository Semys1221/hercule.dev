"use client";

import { memo } from "react";

import { SalesPitchOriginSceneLazy } from "../sales-pitch-origin-scene.lazy";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

const ORIGIN_YEARS = ["2018", "2025", "2026"] as const;

export const PitchSlideProductOrigin = memo(function PitchSlideProductOrigin({
  audience,
}: PitchSlideBaseProps) {
  return (
    <div className="flex flex-col gap-4">
      <SalesPitchOriginSceneLazy audience={audience} />
      <div className="flex items-center justify-between gap-2 px-2">
        {ORIGIN_YEARS.map((year, index) => (
          <div key={year} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-center gap-1">
              {index > 0 ? <span className="h-px flex-1 bg-border" aria-hidden /> : null}
              <span className="size-2.5 rounded-full bg-primary" aria-hidden />
              {index < ORIGIN_YEARS.length - 1 ? (
                <span className="h-px flex-1 bg-border" aria-hidden />
              ) : null}
            </div>
            <span className="text-xs font-medium text-muted-foreground">{year}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
