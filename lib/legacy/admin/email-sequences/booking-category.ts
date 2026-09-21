import type { Niche } from "@/lib/legacy/admin/navigation";
import type { LeadCategory } from "@/lib/legacy/link-tracking/types";

/** Resolve booking_email_templates.category for a sequence slug + niche. */
export function bookingCategoryForSlug(_slug: string, niche: Niche): LeadCategory {
  return niche;
}
