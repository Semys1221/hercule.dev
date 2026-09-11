import { buildComptableActivationMilestones } from "@/lib/retraction/timeline";

import type { TimelineStep } from "./types";

/** Projected DHL timeline for unpaid post-call comptable leads (before Stripe). */
export function buildComptableNotPaidMilestones(now = new Date()): TimelineStep[] {
  const projected = buildComptableActivationMilestones({
    activationAt: now,
    status: "pending",
    now,
  }).map((step) => ({
    id: step.id,
    label: step.label,
    meta: step.estimatedAt,
    status: "pending" as const,
  }));

  return [
    {
      id: "payment",
      label: "Finalisation du paiement",
      status: "active",
    },
    ...projected,
  ];
}
