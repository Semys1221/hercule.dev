import type { Audience } from "@/lib/admin/navigation";
import type { LeadCategory } from "@/lib/link-tracking/types";

/** Maps funnel session audience to CRM / Calendly lead category. */
export function salesAudienceToLeadCategory(audience: Audience): LeadCategory {
  if (audience === "comptable" || audience === "cif" || audience === "entreprise") {
    return audience;
  }
  return "agence";
}

export function isComptableSalesAudience(audience: Audience): boolean {
  return audience === "comptable";
}

export function isCabinetBuyerSalesAudience(audience: Audience): boolean {
  return audience === "comptable" || audience === "cif";
}
