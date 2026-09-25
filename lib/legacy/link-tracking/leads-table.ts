import type { LeadCategory, LinkTrackingLead } from "./types";

export function isUnifiedLeadsCategory(
  category: LeadCategory,
): category is "comptable" | "cif" | "comptable_delivery" {
  return (
    category === "comptable" ||
    category === "cif" ||
    category === "comptable_delivery"
  );
}

export function mapLeadsRowToLinkTracking(
  category: LeadCategory,
  row: Record<string, unknown>,
): LinkTrackingLead {
  const lead = { ...(row as LinkTrackingLead) };
  const reservation = (row.reservation_link as string | null) ?? null;
  const confirmation = (row.confirmation_link as string | null) ?? null;

  if (category === "comptable") {
    lead.reservation_comptable_link = reservation;
    lead.confirmation_comptable_link = confirmation;
  } else if (category === "cif") {
    lead.reservation_cif_link = reservation;
  } else if (category === "comptable_delivery") {
    lead.reservation_comptable_delivery_link = reservation;
    lead.confirmation_comptable_delivery_link = confirmation;
  }

  return lead;
}

/** Maps legacy column names in patches to unified `leads` columns. */
export function mapPatchToLeadsRow(
  category: LeadCategory,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...patch };

  if (category === "comptable") {
    if (out.reservation_comptable_link !== undefined) {
      out.reservation_link = out.reservation_comptable_link;
      delete out.reservation_comptable_link;
    }
    if (out.confirmation_comptable_link !== undefined) {
      out.confirmation_link = out.confirmation_comptable_link;
      delete out.confirmation_comptable_link;
    }
  } else if (category === "cif") {
    if (out.reservation_cif_link !== undefined) {
      out.reservation_link = out.reservation_cif_link;
      delete out.reservation_cif_link;
    }
  } else if (category === "comptable_delivery") {
    if (out.reservation_comptable_delivery_link !== undefined) {
      out.reservation_link = out.reservation_comptable_delivery_link;
      delete out.reservation_comptable_delivery_link;
    }
    if (out.confirmation_comptable_delivery_link !== undefined) {
      out.confirmation_link = out.confirmation_comptable_delivery_link;
      delete out.confirmation_comptable_delivery_link;
    }
  }

  return out;
}

export function outreachInsertRow(
  category: "comptable" | "cif" | "comptable_delivery",
  row: Record<string, unknown>,
): Record<string, unknown> {
  const mapped = mapPatchToLeadsRow(category, row);
  return { ...mapped, category };
}
