/** Unit tests for bookings row dedup and exclusions. */

import assert from "node:assert/strict";

import {
  dedupeBookingRows,
  finalizeBookingRows,
  isExcludedBookingRow,
} from "@/lib/admin/bookings/booking-row-filters";
import type { CalendlyBookingRow } from "@/lib/calendly/list-bookings";

function sampleRow(
  overrides: Partial<CalendlyBookingRow> & Pick<CalendlyBookingRow, "email" | "start_time">,
): CalendlyBookingRow {
  return {
    name: "Prospect",
    first_name: "Prospect",
    company: null,
    invitee_uri: overrides.invitee_uri ?? `https://api.calendly.com/invitees/${overrides.email}`,
    event_uri: "https://api.calendly.com/scheduled_events/EVT",
    event_status: "canceled",
    invitee_status: "canceled",
    questions: {},
    slug: null,
    lead_id: null,
    lead_category: null,
    booking_category: "agence",
    calendly_join_url: null,
    calendly_reschedule_url: null,
    calendly_cancel_url: null,
    ...overrides,
  };
}

function main() {
  assert.equal(isExcludedBookingRow({ email: "nanguy29@gmail.com", name: "Evan" }), true);
  assert.equal(
    isExcludedBookingRow({ email: "pierresinclair73@gmail.com", name: "Kora" }),
    true,
  );
  assert.equal(isExcludedBookingRow({ email: "prospect@example.com", name: "Marie" }), false);

  const deduped = dedupeBookingRows([
    sampleRow({
      email: "contact@57informatique.fr",
      start_time: "2026-09-12T09:00:00.000000Z",
      invitee_uri: "https://api.calendly.com/invitees/A",
    }),
    sampleRow({
      email: "contact@57informatique.fr",
      start_time: "2026-09-12T09:00:00.000000Z",
      invitee_uri: "https://api.calendly.com/invitees/B",
      invitee_status: "active",
      event_status: "active",
      lead_id: "lead-1",
    }),
  ]);
  assert.equal(deduped.length, 1);
  assert.equal(deduped[0]?.invitee_status, "active");
  assert.equal(deduped[0]?.lead_id, "lead-1");

  const finalized = finalizeBookingRows([
    sampleRow({
      email: "nanguy29@gmail.com",
      start_time: "2026-09-18T08:00:00.000000Z",
      name: "Evan",
    }),
    sampleRow({
      email: "pierresinclair73@gmail.com",
      start_time: "2026-09-18T09:00:00.000000Z",
      name: "Kora",
    }),
    sampleRow({
      email: "prospect@example.com",
      start_time: "2026-09-19T09:00:00.000000Z",
    }),
  ]);
  assert.equal(finalized.length, 1);
  assert.equal(finalized[0]?.email, "prospect@example.com");

  console.log("booking-row-filters tests passed");
}

main();
