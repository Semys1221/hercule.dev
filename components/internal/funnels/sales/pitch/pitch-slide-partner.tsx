"use client";

import { memo } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { formatPitchWizardInterpolation } from "@/lib/admin/funnels/sales-pitch-wizard";
import { isCabinetBuyerSalesAudience } from "@/lib/admin/funnels/sales-audience";

import { MilestoneStrip, PitchBuyInSlide, RaciSplit, ZoneScarcityBadge } from "./pitch-primitives";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

const PARTNER_RACI_ROWS = [
  { role: "Capture live", hercule: "Infra + rapports", cabinet: "—" },
  { role: "Inbound", hercule: "—", cabinet: "Réponse < 24 h" },
  { role: "Appels", hercule: "Points réguliers", cabinet: "Décideur présent" },
  { role: "Escalade", hercule: "Ajustement ciblage", cabinet: "Feedback terrain" },
] as const;

export const PitchSlidePartnerContent = memo(function PitchSlidePartnerContent(
  _props: PitchSlideBaseProps,
) {
  return (
    <div className="flex flex-col gap-4">
      <RaciSplit rows={PARTNER_RACI_ROWS} />
    </div>
  );
});

export const PitchSlidePartnerFuture = memo(function PitchSlidePartnerFuture({
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
          <MilestoneStrip
            milestones={[
              { label: "J0", detail: "Onboarding" },
              { label: "J+60", detail: "Système live" },
              { label: "12 mois", detail: interpolate("{goal6m}") },
            ]}
          />
          <Alert>
            <AlertTitle className="flex flex-wrap items-center gap-2">
              Zone {interpolate("{department}")}
              <Badge variant="outline">Verrou 12 mois</Badge>
            </AlertTitle>
            <AlertDescription>
              <ZoneScarcityBadge department={interpolate("{department}")} />
            </AlertDescription>
          </Alert>
        </div>
      }
    />
  );
});
