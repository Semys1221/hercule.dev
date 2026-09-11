import {
  activationAt,
  buildActivationMilestones,
  buildComptableActivationMilestones,
  resolveDashboardRetraction,
} from "@/lib/retraction";
import type { DashboardRetraction } from "@/lib/retraction";
import type { LeadCategory } from "@/lib/link-tracking/types";

import type { TimelineStep } from "./types";

export function buildDashboardRetractionFields(params: {
  category: LeadCategory;
  lead: {
    retraction_status?: string | null;
    retraction_ends_at?: string | null;
    retraction_waived_at?: string | null;
    onboarding_completed_at?: string | null;
    product_statut?: string | null;
  };
  isFastCheckout?: boolean;
}): {
  retraction: DashboardRetraction | null;
  milestones: TimelineStep[];
} {
  const retraction = resolveDashboardRetraction({
    category: params.category,
    row: params.lead,
    productStatut: params.lead.product_statut,
    isFastCheckout: params.isFastCheckout,
  });

  if (!retraction?.activationAt) {
    return { retraction, milestones: [] };
  }

  const activation = activationAt({
    status: retraction.status,
    waivedAt: retraction.waivedAt,
    endsAt: retraction.endsAt,
    completedAt: params.lead.onboarding_completed_at ?? null,
  });

  if (!activation) {
    return { retraction, milestones: [] };
  }

  const buildMilestones =
    params.category === "comptable"
      ? buildComptableActivationMilestones
      : buildActivationMilestones;

  const milestones = buildMilestones({
    activationAt: activation,
    status: retraction.status,
    ...(params.category === "agence"
      ? { isFastCheckout: params.isFastCheckout ?? false }
      : {}),
  }).map((m) => ({
    id: m.id,
    label: m.label,
    status: m.status,
    meta: m.estimatedAt,
  }));

  // #region agent log
  if (params.category === "comptable") {
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "9c08cc",
      },
      body: JSON.stringify({
        sessionId: "9c08cc",
        runId: "pre-fix",
        hypothesisId: "A,B,E",
        location: "lib/dashboard/retraction-fields.ts:buildDashboardRetractionFields",
        message: "comptable milestone dates computed",
        data: {
          retractionStatus: retraction.status,
          activationAt: activation.toISOString(),
          retractionEndsAt: retraction.endsAt,
          onboardingCompletedAt: params.lead.onboarding_completed_at ?? null,
          firstRdvMilestone: milestones.find((m) => m.id === "first_rdv") ?? null,
          allMilestones: milestones.map((m) => ({ id: m.id, meta: m.meta, status: m.status })),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion

  return { retraction, milestones };
}
