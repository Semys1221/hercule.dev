import type { Audience } from "@/lib/admin/navigation";
import type { LeadCategory } from "@/lib/link-tracking/types";

/** Maps funnel session audience to CRM / Calendly lead category. */
export function salesAudienceToLeadCategory(audience: Audience): LeadCategory {
  if (audience === "comptable") {
    return "comptable";
  }
  if (audience === "entreprise") {
    return "entreprise";
  }
  return "agence";
}

export function isComptableSalesAudience(audience: Audience): boolean {
  return audience === "comptable";
}
