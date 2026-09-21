/** Unit tests for client-side Calendly bookings cache. */

import assert from "node:assert/strict";

import {
  isBookingsClientCacheEntryValid,
  readBookingsClientCache,
  writeBookingsClientCache,
  type BookingsClientCacheEntry,
} from "@/lib/legacy/calendly/bookings-client-cache";
import { BOOKINGS_CACHE_REVALIDATE_SECONDS } from "@/lib/legacy/calendly/bookings-cache-constants";
import type { EnrichedCalendlyBooking } from "@/lib/legacy/calendly/enrich-bookings";

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

const EVENT_URI = "https://api.calendly.com/event_types/ABC123";

function sampleBooking(inviteeUri: string): EnrichedCalendlyBooking {
  return {
    email: "prospect@example.com",
    name: "Marie Dupont",
    first_name: "Marie",
    company: "Acme",
    start_time: "2026-09-07T08:00:00.000Z",
    invitee_uri: inviteeUri,
    event_uri: "https://api.calendly.com/scheduled_events/EVT",
    questions: {},
    slug: "abc123",
    lead_id: null,
    lead_category: null,
    booking_category: "agence",
    calendly_join_url: null,
    calendly_reschedule_url: null,
    calendly_cancel_url: null,
    event_status: "active",
    invitee_status: "active",
    statut: null,
    sales_call_status: null,
    links: {
      reservation_agence_link: null,
      reservation_entreprise_link: null,
      reservation_comptable_link: null,
      confirmation_agence_link: null,
      confirmation_comptable_link: null,
      dashboard_link: null,
      calendly_join_url: null,
      calendly_reschedule_url: null,
      calendly_cancel_url: null,
    },
    lead_matched: false,
    provisioned: false,
    warning: null,
  };
}

const now = Date.UTC(2026, 8, 7, 8, 0, 0);

assert.equal(
  isBookingsClientCacheEntryValid(
    { fetchedAt: now - BOOKINGS_CACHE_REVALIDATE_SECONDS * 1000, bookings: [] },
    now,
  ),
  true,
);

assert.equal(
  isBookingsClientCacheEntryValid(
    {
      fetchedAt: now - (BOOKINGS_CACHE_REVALIDATE_SECONDS * 1000 + 1),
      bookings: [],
    },
    now,
  ),
  true,
);

const storage = new MemoryStorage();
const booking = sampleBooking("https://api.calendly.com/scheduled_events/EVT/invitees/INV");

writeBookingsClientCache("agence", [booking], 0, now, storage, undefined, EVENT_URI);

const cached = readBookingsClientCache("agence", 0, EVENT_URI, now, storage);
assert.ok(cached);
assert.equal(cached.bookings.length, 1);
assert.equal(cached.bookings[0]?.invitee_uri, booking.invitee_uri);

const stillCached = readBookingsClientCache(
  "agence",
  0,
  EVENT_URI,
  now + BOOKINGS_CACHE_REVALIDATE_SECONDS * 1000 + 1,
  storage,
);
assert.ok(stillCached);
assert.equal(stillCached.bookings.length, 1);

writeBookingsClientCache("agence", [booking], 0, now, storage, undefined, EVENT_URI);
const wrongEventType = readBookingsClientCache(
  "agence",
  0,
  "https://api.calendly.com/event_types/OTHER",
  now,
  storage,
);
assert.equal(wrongEventType, null);

const malformed: BookingsClientCacheEntry = { fetchedAt: now, bookings: [] };
storage.setItem("hercule:calendly-bookings:v2:entreprise:0:none", "{not-json");
assert.equal(readBookingsClientCache("entreprise", 0, null, now, storage), null);

writeBookingsClientCache("agence", [booking], 30, now, storage, undefined, EVENT_URI);
const salesCached = readBookingsClientCache("agence", 30, EVENT_URI, now, storage);
assert.ok(salesCached);
assert.equal(salesCached.bookings[0]?.invitee_uri, booking.invitee_uri);
assert.equal(
  readBookingsClientCache("agence", 0, EVENT_URI, now, storage)?.bookings.length,
  1,
);

console.log("bookings-client-cache.test.ts: ok");
