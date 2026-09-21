import type { BookingLostVariant } from "@/lib/legacy/admin/bookings/booking-local-docs";
import {
  leadStatutBadgeVariant,
  leadStatutLabel,
} from "@/lib/legacy/admin/bookings/lead-statut-labels";
import { bookingRowActionState } from "@/lib/legacy/calendly/booking-row-actions";
import type { SalesCallStatus } from "@/lib/legacy/sales-calls/types";

export type BookingEtatView = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
};

/**
 * Returns the single most recent booking state for display.
 * Post-call outcomes (paid / no-show / not paid) supersede CRM lead statut.
 */
export function resolveBookingEtat(
  statut: string | null | undefined,
  salesCallStatus: SalesCallStatus | null,
  lostVariant?: BookingLostVariant | null,
  calendlyCanceled = false,
): BookingEtatView {
  if (calendlyCanceled || statut === "CANCELLED") {
    return { label: "Annulé", variant: "destructive" };
  }

  const { badge } = bookingRowActionState(salesCallStatus);

  if (badge === "PAID") {
    return { label: "Payé", variant: "secondary" };
  }
  if (badge === "NO SHOW") {
    return { label: "Absent", variant: "destructive" };
  }
  if (badge === "NON PAYÉ") {
    return { label: "Non payé", variant: "outline" };
  }
  if (badge === "PERDU") {
    if (lostVariant === "unqualified") {
      return { label: "Unqualified", variant: "outline" };
    }
    return { label: "Perdu", variant: "destructive" };
  }

  return {
    label: leadStatutLabel(statut),
    variant: leadStatutBadgeVariant(statut),
  };
}
