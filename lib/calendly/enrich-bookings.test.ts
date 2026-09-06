/** Unit tests for booking link enrichment helpers. */

import assert from "node:assert/strict";

import type { CalendlyBookingRow } from "@/lib/calendly/list-bookings";
import {
  buildCrmLinks,
  buildDisplayLinks,
  mergeMeetingLinks,
} from "@/lib/calendly/enrich-bookings";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";
import { reservationAgenceLinkFor } from "@/lib/link-tracking/urls";

function baseBooking(
  overrides: Partial<CalendlyBookingRow> = {},
): CalendlyBookingRow {
  return {
    email: "prospect@example.com",
    name: "Marie Dupont",
    first_name: "Marie",
    company: "Acme",
    start_time: "2026-09-07T08:00:00.000Z",
    invitee_uri: "https://api.calendly.com/scheduled_events/EVT/invitees/INV",
    event_uri: "https://api.calendly.com/scheduled_events/EVT",
    questions: {},
    slug: "abc123",
    lead_id: null,
    lead_category: null,
    booking_category: "agence",
    calendly_join_url: "https://meet.google.com/abc-defg-hij",
    calendly_reschedule_url: "https://calendly.com/reschedulings/RS",
    calendly_cancel_url: "https://calendly.com/cancellations/CX",
    ...overrides,
  };
}

function baseLead(overrides: Partial<LinkTrackingLead> = {}): LinkTrackingLead {
  return {
    id: "lead-1",
    email: "prospect@example.com",
    statut: "MEETING_BOOKED",
    slug: "abc123",
    reservation_agence_link: "https://www.hercule.dev/reservation.html/abc123",
    reservation_entreprise_link:
      "https://www.hercule.dev/reservation-entreprise.html/abc123",
    confirmation_agence_link:
      "https://www.hercule.dev/confirm-reservation.html/abc123?email=prospect%40example.com",
    dashboard_link: "https://www.hercule.dev/dashboard/abc123",
    instantly_lead_id: null,
    instantly_campaign_id: null,
    calendly_invitee_uri: null,
    calendly_join_url: null,
    calendly_reschedule_url: null,
    calendly_cancel_url: null,
    calendly_links_synced_at: null,
    calendly_links_sync_error: null,
    booked_at: null,
    instantly_synced_at: null,
    first_name: "Marie",
    company: "Acme",
    calendly_payload: null,
    calendly_questions: null,
    scheduled_at: null,
    confirmed_at: null,
    instantly_confirmed_synced_at: null,
    onboarding_completed_at: null,
    profile: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function main() {
  const booking = baseBooking();
  const lead = baseLead({
    calendly_join_url: "https://meet.google.com/stored",
    calendly_reschedule_url: "https://calendly.com/reschedulings/stored",
    calendly_cancel_url: "https://calendly.com/cancellations/stored",
  });

  const merged = mergeMeetingLinks(booking, lead);
  assert.equal(merged.calendly_join_url, booking.calendly_join_url);
  assert.equal(merged.calendly_reschedule_url, booking.calendly_reschedule_url);
  assert.equal(merged.calendly_cancel_url, booking.calendly_cancel_url);

  const fromLeadOnly = mergeMeetingLinks(
    baseBooking({
      calendly_join_url: null,
      calendly_reschedule_url: null,
      calendly_cancel_url: null,
    }),
    lead,
  );
  assert.equal(fromLeadOnly.calendly_join_url, lead.calendly_join_url);

  const crmFromLead = buildCrmLinks(lead, "abc123", "prospect@example.com");
  assert.equal(crmFromLead.reservation_agence_link, lead.reservation_agence_link);
  assert.equal(crmFromLead.dashboard_link, lead.dashboard_link);

  const crmFromSlug = buildCrmLinks(null, "xyz789", "other@example.com");
  assert.match(crmFromSlug.reservation_agence_link ?? "", /xyz789/);
  assert.match(crmFromSlug.confirmation_agence_link ?? "", /xyz789/);
  assert.match(crmFromSlug.dashboard_link ?? "", /xyz789/);

  const crmEmpty = buildCrmLinks(null, null, "orphan@example.com");
  assert.equal(crmEmpty.reservation_agence_link, null);

  const leadMissingReservation = baseLead({
    reservation_agence_link: "",
  });
  const crmFromSlugOnLead = buildCrmLinks(
    leadMissingReservation,
    "abc123",
    "prospect@example.com",
  );
  assert.equal(
    crmFromSlugOnLead.reservation_agence_link,
    reservationAgenceLinkFor(leadMissingReservation),
  );
  assert.match(crmFromSlugOnLead.reservation_agence_link ?? "", /abc123/);

  const display = buildDisplayLinks(booking, lead);
  assert.equal(display.reservation_agence_link, lead.reservation_agence_link);
  assert.equal(display.calendly_cancel_url, booking.calendly_cancel_url);

  console.log("enrich-bookings tests passed");
}

main();
