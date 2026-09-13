import type { BookingDisplayLinks } from "@/lib/calendly/enrich-bookings";
import { primaryReservationLink } from "@/lib/calendly/enrich-bookings";
import type { LeadCategory, LinkTrackingLead } from "@/lib/link-tracking/types";
import {
  confirmationComptableLinkFor,
  postBookingLinkFor,
  reservationComptableLinkFor,
  reservationEntrepriseLinkFor,
} from "@/lib/link-tracking/urls";

export function resolveSalesSessionReservationLink(
  leadCategory: LeadCategory,
  selectedLead: LinkTrackingLead | null,
  bookingLinks: BookingDisplayLinks | undefined,
): string | null {
  if (selectedLead) {
    if (leadCategory === "entreprise") {
      return reservationEntrepriseLinkFor(selectedLead) || null;
    }
    if (leadCategory === "comptable") {
      const link = reservationComptableLinkFor(selectedLead);
      return link || null;
    }
    return selectedLead.reservation_agence_link || null;
  }
  if (!bookingLinks) {
    return null;
  }
  return primaryReservationLink(bookingLinks, leadCategory);
}

export function resolveSalesSessionConfirmationLink(
  leadCategory: LeadCategory,
  selectedLead: LinkTrackingLead | null,
  bookingLinks: BookingDisplayLinks | undefined,
): string | null {
  if (leadCategory === "entreprise") {
    if (selectedLead) {
      return postBookingLinkFor(selectedLead);
    }
    return bookingLinks?.confirmation_agence_link ?? null;
  }
  if (leadCategory === "comptable") {
    if (selectedLead) {
      const link = confirmationComptableLinkFor(selectedLead);
      return link || null;
    }
    return (
      bookingLinks?.confirmation_comptable_link ??
      bookingLinks?.confirmation_agence_link ??
      null
    );
  }
  return (
    selectedLead?.confirmation_agence_link ??
    bookingLinks?.confirmation_agence_link ??
    null
  );
}
