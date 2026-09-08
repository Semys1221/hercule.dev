import type { LeadStatut } from "@/lib/link-tracking/types";

import { isTooSoonForModalites } from "./schedule";
import type { ModalitesSkipReason } from "./types";

export function modalitesSkipReason(params: {
  scheduledAt: string | null;
  leadId: string | null;
  statut: LeadStatut | string | null;
  now?: Date;
}): ModalitesSkipReason | null {
  if (!params.leadId) {
    return "no_lead";
  }
  if (!params.scheduledAt) {
    return "missing_start";
  }
  const start = new Date(params.scheduledAt);
  if (Number.isNaN(start.getTime())) {
    return "missing_start";
  }
  if (params.statut === "CONFIRMED") {
    return "confirmed";
  }
  if (params.statut === "CANCELLED") {
    return "cancelled";
  }
  if (isTooSoonForModalites(start, params.now ?? new Date())) {
    return "too_soon";
  }
  return null;
}
