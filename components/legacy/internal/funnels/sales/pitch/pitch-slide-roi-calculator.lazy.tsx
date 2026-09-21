"use client";

import dynamic from "next/dynamic";

import type { PitchSlideBaseProps } from "./pitch-slide-props";

const PitchSlideRoiCalculator = dynamic(
  () =>
    import("./pitch-slide-roi-calculator").then((mod) => mod.PitchSlideRoiCalculator),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        Chargement du calculateur ROI…
      </div>
    ),
  },
);

export function PitchSlideRoiCalculatorLazy(props: PitchSlideBaseProps) {
  return <PitchSlideRoiCalculator {...props} />;
}
