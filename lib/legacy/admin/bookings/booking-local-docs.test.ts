/** Unit tests for booking local documentation storage. */

import assert from "node:assert/strict";

import {
  readAllBookingLocalDocs,
  readBookingLocalDoc,
  requiresBookingLocalNote,
  writeBookingLocalDoc,
} from "@/lib/legacy/admin/bookings/booking-local-docs";

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

writeBookingLocalDoc(
  "https://api.calendly.com/scheduled_events/abc/invitees/1",
  {
    note: "Pas le budget",
    markedAs: "not_paid",
  },
  storage,
);

writeBookingLocalDoc(
  "https://api.calendly.com/scheduled_events/abc/invitees/2",
  {
    note: "Hors cible",
    markedAs: "lost",
    lostVariant: "unqualified",
  },
  storage,
);

const all = readAllBookingLocalDocs(storage);
assert.equal(Object.keys(all).length, 2);

const unqualified = readBookingLocalDoc(
  "https://api.calendly.com/scheduled_events/abc/invitees/2",
  storage,
);
assert.equal(unqualified?.lostVariant, "unqualified");
assert.equal(unqualified?.note, "Hors cible");

assert.equal(requiresBookingLocalNote("not_paid"), true);
assert.equal(requiresBookingLocalNote("lost"), true);
assert.equal(requiresBookingLocalNote("no_show"), false);

console.log("booking-local-docs.test.ts: ok");
