"use client";

import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import { formatPitchWizardInterpolation } from "@/lib/admin/funnels/sales-pitch-wizard";

import { SalesDashboardLinkCopy } from "../sales-dashboard-link-copy";
import { GlowCard } from "./pitch-primitives";
import { PitchTriptych } from "./pitch-triptych";
import type { PitchSlideContentProps } from "./pitch-slide-props";

export const PitchSlideDashboard = memo(function PitchSlideDashboard({
  slide,
  audience,
  values,
  context,
  selectedLead,
  selectedBooking,
  developerModeEnabled,
  onRefreshLead,
}: PitchSlideContentProps) {
  const goalLabel = formatPitchWizardInterpolation("{goal6m}", values, audience, context);

  return (
    <div className="flex flex-col gap-4">
      <PitchTriptych
        stepId={slide.id}
        audience={audience}
        values={values}
        context={context}
      />
      <GlowCard variant="primary" className="items-center text-center">
        <Badge variant="secondary" className="text-sm">
          {goalLabel}
        </Badge>
      </GlowCard>
      <SalesDashboardLinkCopy
        audience={audience}
        selectedLead={selectedLead}
        selectedBooking={selectedBooking}
        developerMode={developerModeEnabled}
        onRefreshLead={onRefreshLead}
      />
    </div>
  );
});
