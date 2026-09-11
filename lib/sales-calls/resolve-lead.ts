import type { LeadCategory } from "@/lib/link-tracking/types";

import type { SalesCall } from "./types";

export type ResolvedSalesCallLead = {
  leadId: string;
  category: LeadCategory;
};

export function resolveSalesCallLead(salesCall: SalesCall): ResolvedSalesCallLead | null {
  if (salesCall.comptable_id) {
    return { leadId: salesCall.comptable_id, category: "comptable" };
  }
  if (salesCall.cif_id) {
    return { leadId: salesCall.cif_id, category: "cif" };
  }
  if (salesCall.agence_id) {
    return { leadId: salesCall.agence_id, category: "agence" };
  }
  if (salesCall.entreprise_id) {
    return { leadId: salesCall.entreprise_id, category: "entreprise" };
  }
  return null;
}

export function upsertIdsForLeadCategory(
  category: LeadCategory,
  leadId: string,
): {
  agenceId?: string | null;
  comptableId?: string | null;
  cifId?: string | null;
  entrepriseId?: string | null;
} {
  switch (category) {
    case "comptable":
      return { comptableId: leadId };
    case "cif":
      return { cifId: leadId };
    case "entreprise":
      return { entrepriseId: leadId };
    default:
      return { agenceId: leadId };
  }
}
