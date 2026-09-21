import {
  buildBleedTrack,
  type BleedTrack,
} from "@/lib/legacy/admin/funnels/sales-bleed-track";
import type { SalesQualificationValues } from "@/lib/legacy/admin/funnels/sales-qualification-schema";
import type { DashboardFaqAudience } from "@/lib/legacy/dashboard/types";

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
