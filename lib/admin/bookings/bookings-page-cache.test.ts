/** Unit tests for bookings page localStorage cache. */

import assert from "node:assert/strict";

import {
  clearBookingsPageCache,
  formatBookingsCacheAge,
  readBookingsPageCache,
  writeBookingsPageCache,
} from "@/lib/admin/bookings/bookings-page-cache";

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

const storage = new MemoryStorage();
const now = Date.UTC(2026, 8, 7, 8, 0, 0);

writeBookingsPageCache(
  "cif",
  {
    fetchedAt: now,
    eventTypeUri: "https://api.calendly.com/event_types/ABC",
    bookings: [],
    jobsByLeadId: {},
    campaignStats: { linked: true, sent: 100 },
    calendlyConfigured: true,
    campaignLinked: true,
  },
  30,
  storage,
);

const cached = readBookingsPageCache("cif", 30, storage);
assert.ok(cached);
assert.equal(cached.campaignStats?.sent, 100);

clearBookingsPageCache("cif", 30, storage);
assert.equal(readBookingsPageCache("cif", 30, storage), null);

assert.match(formatBookingsCacheAge(now, now + 120_000), /2 min/);

console.log("bookings-page-cache.test.ts: ok");
