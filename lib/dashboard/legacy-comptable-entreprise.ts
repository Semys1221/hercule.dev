import type { LinkTrackingLead } from "@/lib/link-tracking/types";

/** Entreprise-table rows that pay via the comptable checkout (pre-migration). */
export function isLegacyComptableEntrepriseLead(
  lead: Pick<
    LinkTrackingLead,
    "reservation_comptable_link" | "confirmation_comptable_link"
  >,
): boolean {
  return Boolean(
    lead.reservation_comptable_link?.trim() || lead.confirmation_comptable_link?.trim(),
  );
}
