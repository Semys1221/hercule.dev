import type { UseFormReturn } from "react-hook-form";

import type { PitchInterpolationContext } from "@/lib/legacy/admin/funnels/sales-pitch-wizard";
import type { SalesQualificationValues } from "@/lib/legacy/admin/funnels/sales-qualification-schema";
import type { Audience } from "@/lib/legacy/admin/navigation";
import type { EnrichedCalendlyBooking } from "@/lib/legacy/calendly/enrich-bookings";
import type { LinkTrackingLead } from "@/lib/legacy/link-tracking/types";

import type { PitchSlideDefinition } from "../sales-pitch-wizard-slides";

export type PitchSlideBaseProps = {
  slide: PitchSlideDefinition;
  audience: Audience;
  form: UseFormReturn<SalesQualificationValues>;
  values: SalesQualificationValues;
  context: PitchInterpolationContext;
  immersive?: boolean;
};

export type PitchSlideContentProps = PitchSlideBaseProps & {
  selectedLead: LinkTrackingLead | null;
  selectedBooking: EnrichedCalendlyBooking | null;
  developerModeEnabled: boolean;
  onRefreshLead?: () => Promise<void>;
};
