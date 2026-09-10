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
}): {
  retraction: DashboardRetraction | null;
  milestones: TimelineStep[];
} {
  const retraction = resolveDashboardRetraction({
    category: params.category,
    row: params.lead,
    productStatut: params.lead.product_statut,
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
  }).map((m) => ({
    id: m.id,
    label: m.label,
    status: m.status,
    meta: m.estimatedAt,
  }));

  return { retraction, milestones };
}
