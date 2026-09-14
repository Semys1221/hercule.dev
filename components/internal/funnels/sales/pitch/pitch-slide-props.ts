import type { UseFormReturn } from "react-hook-form";

import type { PitchInterpolationContext } from "@/lib/admin/funnels/sales-pitch-wizard";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import type { Audience } from "@/lib/admin/navigation";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";

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
