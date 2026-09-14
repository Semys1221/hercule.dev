"use client";

import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import { formatPitchWizardInterpolation } from "@/lib/admin/funnels/sales-pitch-wizard";

import { SalesDashboardLinkCopy } from "../sales-dashboard-link-copy";
import type { PitchSlideContentProps } from "./pitch-slide-props";

export const PitchSlideDashboard = memo(function PitchSlideDashboard({
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
      <Badge variant="secondary" className="w-fit text-sm">
        {goalLabel}
      </Badge>
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
