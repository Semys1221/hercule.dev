import { getEmailSequence } from "@/lib/admin/email-sequences/registry";
import type { Niche } from "@/lib/admin/navigation";
import type { LeadCategory } from "@/lib/link-tracking/types";

/** Resolve booking_email_templates.category for a sequence slug + niche. */
export function bookingCategoryForSlug(slug: string, niche: Niche): LeadCategory {
  const sequence = getEmailSequence(slug);

  if (niche === "comptable" || niche === "cif") {
    return niche;
  }

  if (sequence?.bookingCategory) {
    return sequence.bookingCategory;
  }

  return niche;
}
