"use client";

import { memo } from "react";

import {
  FOUNDATION_ACTIVATION_CLOCKS,
  FOUNDATION_DEPLOYMENT_PHASES,
  FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES,
} from "@/lib/legacy/admin/funnels/comptable-sales-copy";
import {
  CIF_FOUNDATION_ACTIVATION_CLOCKS,
  CIF_FOUNDATION_DEPLOYMENT_PHASES,
  CIF_FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES,
} from "@/lib/legacy/admin/funnels/cif-sales-copy";
import { isCabinetBuyerSalesAudience, isCifSalesAudience } from "@/lib/legacy/admin/funnels/sales-audience";

import {
  buildActivationDeploymentTimelineSteps,
  SalesPitchHorizontalTimeline,
} from "../sales-foundation-timeline";
import { DualClock, PitchBuyInSlide } from "./pitch-primitives";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

export const PitchSlideActivation = memo(function PitchSlideActivation({
  audience,
  form,
  immersive,
}: PitchSlideBaseProps) {
  const phases = isCifSalesAudience(audience)
    ? CIF_FOUNDATION_DEPLOYMENT_PHASES
    : FOUNDATION_DEPLOYMENT_PHASES;
  const clocks = isCifSalesAudience(audience)
    ? CIF_FOUNDATION_ACTIVATION_CLOCKS
    : FOUNDATION_ACTIVATION_CLOCKS;
  const weeklyLines = isCifSalesAudience(audience)
    ? CIF_FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES
    : FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES;
  const steps = buildActivationDeploymentTimelineSteps(phases, weeklyLines, clocks);
  const buyInPrompt = isCabinetBuyerSalesAudience(audience)
    ? "Ça fait sens pour le cabinet ?"
    : "Ça fait sens ?";

  return (
    <PitchBuyInSlide
      form={form}
      fieldName="p7BuyIn"
      buyInPrompt={buyInPrompt}
      content={
        <div className="flex flex-col gap-4">
          <DualClock
            leftLabel="Déploiement live"
            leftValue={60}
            leftMax={60}
            rightLabel="Fenêtre garantie"
            rightValue={90}
            rightMax={90}
          />
          <SalesPitchHorizontalTimeline
            immersive={immersive}
            steps={steps}
            activeStatusLabel="Activation"
          />
        </div>
      }
    />
  );
});
