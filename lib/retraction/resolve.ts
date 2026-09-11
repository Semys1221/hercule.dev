import type { LeadCategory } from "@/lib/link-tracking/types";

import { retractionAppliesTo } from "./applies";
import { activationAt, firstContratWorkingDays, comptableFirstRdvCalendarDays } from "./dates";
import type { DashboardRetraction, RetractionRow, RetractionStatus } from "./types";

function normalizeStatus(raw: string | null | undefined): RetractionStatus {
  if (
    raw === "pending" ||
    raw === "waived" ||
    raw === "expired" ||
    raw === "n_a"
  ) {
    return raw;
  }
  return "n_a";
}

export function resolveDashboardRetraction(params: {
  category: LeadCategory;
  row: RetractionRow;
  productStatut?: string | null;
  isFastCheckout?: boolean;
}): DashboardRetraction | null {
  if (!retractionAppliesTo(params.category)) {
    return null;
  }

  const status = normalizeStatus(params.row.retraction_status);
  const endsAt = params.row.retraction_ends_at ?? null;
  const waivedAt = params.row.retraction_waived_at ?? null;
  const completedAt = params.row.onboarding_completed_at ?? null;

  const activation = activationAt({ status, waivedAt, endsAt, completedAt });
  const isDeliverance =
    params.productStatut === "IN_DELIVERANCE" ||
    params.productStatut === "MATCH_PROPOSED" ||
    params.productStatut === "MEETING_BOOKED" ||
    params.productStatut === "POST_RDV_SURVEY" ||
    params.productStatut === "SOLD";

  const canWaive =
    status === "pending" &&
    Boolean(completedAt) &&
    !isDeliverance &&
    (endsAt ? new Date(endsAt).getTime() > Date.now() : true);

  return {
    status,
    endsAt,
    waivedAt,
    canWaive,
    activationAt: activation?.toISOString() ?? null,
    firstContratWorkingDays:
      params.category === "comptable"
        ? comptableFirstRdvCalendarDays(status)
        : firstContratWorkingDays(status, params.isFastCheckout ?? false),
  };
}
