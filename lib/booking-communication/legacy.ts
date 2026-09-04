import type { LeadCategory, LinkTrackingLead } from "@/lib/link-tracking/types";

const DEFAULT_GO_LIVE_AT = "2026-09-03T14:00:00.000Z";

export function getBookingGoLiveAt(): Date {
  const raw = process.env.BOOKING_GO_LIVE_AT?.trim() || DEFAULT_GO_LIVE_AT;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(DEFAULT_GO_LIVE_AT);
  }
  return parsed;
}

export function isLegacyAgenceLead(
  category: LeadCategory,
  lead: Pick<LinkTrackingLead, "booked_at">,
): boolean {
  if (category !== "agence") {
    return false;
  }
  const bookedAt = lead.booked_at?.trim();
  if (!bookedAt) {
    return true;
  }
  const booked = new Date(bookedAt);
  if (Number.isNaN(booked.getTime())) {
    return true;
  }
  return booked.getTime() < getBookingGoLiveAt().getTime();
}
