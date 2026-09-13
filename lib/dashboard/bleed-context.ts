import {
  buildBleedTrack,
  type BleedTrack,
} from "@/lib/admin/funnels/sales-bleed-track";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import type { DashboardFaqAudience } from "@/lib/dashboard/types";

export type DashboardBleedContext = {
  bleed: BleedTrack;
  firstName?: string;
  zone?: string;
};

export function buildDashboardBleedContext(
  qualification: Partial<SalesQualificationValues> | undefined,
  audience: DashboardFaqAudience,
  options: { firstName?: string | null; zone?: string },
): DashboardBleedContext | undefined {
  if (!qualification || typeof qualification !== "object") {
    return undefined;
  }

  const bleed = buildBleedTrack(qualification as SalesQualificationValues, audience);
  const hasSignal =
    Boolean(bleed.cause) ||
    Boolean(bleed.gap) ||
    Boolean(bleed.goal) ||
    typeof bleed.honorairesAnnual === "number";

  if (!hasSignal) {
    return undefined;
  }

  return {
    bleed,
    firstName: options.firstName?.trim() || undefined,
    zone: options.zone?.trim() || undefined,
  };
}
