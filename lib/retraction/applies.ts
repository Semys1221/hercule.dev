import type { LeadCategory } from "@/lib/link-tracking/types";

import type { RetractionAudience } from "./types";

export function retractionAppliesTo(
  category: LeadCategory,
): category is RetractionAudience {
  return category === "agence" || category === "comptable";
}
