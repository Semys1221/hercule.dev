"use client";

import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import { formatPitchWizardInterpolation } from "@/lib/legacy/admin/funnels/sales-pitch-wizard";
import { isCabinetBuyerSalesAudience } from "@/lib/legacy/admin/funnels/sales-audience";

import {
  GlowCard,
  MilestoneStrip,
  PitchBuyInSlide,
  ZoneScarcityBadge,
} from "./pitch-primitives";
import { PitchTriptych } from "./pitch-triptych";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

const PARTNER_SPLIT = [
  { role: "Capture live", hercule: "Infra + rapports", cabinet: "—" },
  { role: "Inbound", hercule: "—", cabinet: "Réponse < 24 h" },
] as const;

export const PitchSlidePartner = memo(function PitchSlidePartner({
  slide,
  audience,
  form,
  values,
  context,
}: PitchSlideBaseProps) {
  const interpolate = (template: string) =>
    formatPitchWizardInterpolation(template, values, audience, context);
  const buyInPrompt = isCabinetBuyerSalesAudience(audience)
    ? "Ça fait sens pour le cabinet ?"
    : "Ça fait sens ?";

  return (
    <PitchBuyInSlide
      form={form}
      fieldName="p9BuyIn"
      buyInPrompt={buyInPrompt}
      content={
        <div className="flex flex-col gap-4">
          <PitchTriptych
            stepId={slide.id}
            audience={audience}
            values={values}
            context={context}
          />
          <div className="flex flex-col gap-2">
            {PARTNER_SPLIT.map((row) => (
              <GlowCard key={row.role} className="grid grid-cols-3 gap-2 text-xs">
                <span className="font-medium">{row.role}</span>
                <span className="text-center text-primary">{row.hercule}</span>
                <span className="text-center text-muted-foreground">{row.cabinet}</span>
              </GlowCard>
            ))}
          </div>
          <MilestoneStrip
            milestones={[
              { label: "J0", detail: "Onboarding" },
              { label: "J+60", detail: "Système live" },
              { label: "12 mois", detail: interpolate("{goal6m}") },
            ]}
          />
          <GlowCard variant="primary">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Zone {interpolate("{department}")}</span>
              <Badge variant="outline">Verrou 12 mois</Badge>
            </div>
            <ZoneScarcityBadge department={interpolate("{department}")} />
          </GlowCard>
        </div>
      }
    />
  );
});
