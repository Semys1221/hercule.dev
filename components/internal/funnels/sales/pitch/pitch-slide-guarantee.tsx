"use client";

import { BadgeEuro, Clock, Percent } from "lucide-react";
import { memo } from "react";

import { FOUNDATION_ROI_DISPLAY } from "@/lib/admin/funnels/comptable-sales-copy";
import { formatFoundationEuros } from "@/lib/commercial/constants";

import { GlowHero, MetricTile } from "./pitch-primitives";
import { PitchTriptych } from "./pitch-triptych";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

export const PitchSlideGuarantee = memo(function PitchSlideGuarantee({
  slide,
  audience,
  values,
  context,
}: PitchSlideBaseProps) {
  const yearOneLabel = formatFoundationEuros(FOUNDATION_ROI_DISPLAY.yearOneValueEur * 100);

  return (
    <div className="flex flex-col gap-4">
      <PitchTriptych
        stepId={slide.id}
        audience={audience}
        values={values}
        context={context}
      />
      <GlowHero
        value={`${FOUNDATION_ROI_DISPLAY.guaranteeRdvCount} RDV B2B`}
        label={`garantis en ${FOUNDATION_ROI_DISPLAY.guaranteeWindowMonths} mois`}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile
          icon={Clock}
          value="60 j"
          label="Déploiement live"
          tone="muted"
          compact
          glow
        />
        <MetricTile
          icon={BadgeEuro}
          value="90 j"
          label="Fenêtre garantie"
          tone="primary"
          compact
          glow
        />
        <MetricTile icon={Percent} value="0 %" label="Commission" tone="muted" compact glow />
      </div>
      <p className="text-center text-sm font-medium text-primary">{yearOneLabel} valeur année 1</p>
    </div>
  );
});
