/** Unit tests for Bookings → Séquences tab matrix (Phase 4 §6.3). */

import assert from "node:assert/strict";

import {
  BOOKINGS_SEQUENCE_TABS,
  bookingsSequenceTabsForNiche,
  isBookingsSequenceTabLive,
  resolveBookingsSequenceEntry,
} from "@/lib/legacy/admin/bookings/bookings-sequence-tabs";
import {
  bookingSequenceTypesFor,
  getEmailSequence,
  meetingSequenceSlugForNiche,
} from "@/lib/legacy/admin/email-sequences/registry";

const ALL_NICHES = ["agence", "comptable", "entreprise", "cif"] as const;
const EXPECTED_BOOKING_TAB_IDS = [
  "subsequence",
  "reply",
  "confirm",
  "reminders",
  "no-show",
  "absent",
  "not-paid",
] as const;

assert.equal(meetingSequenceSlugForNiche("agence"), "meeting-agence");
assert.equal(meetingSequenceSlugForNiche("comptable"), "meeting-comptable");
assert.equal(meetingSequenceSlugForNiche("entreprise"), "meeting-entreprise");
assert.equal(meetingSequenceSlugForNiche("cif"), "meeting-cif");

const comptableMeeting = getEmailSequence("meeting-comptable");
assert.ok(comptableMeeting);
assert.equal(comptableMeeting?.bookingCategory, "comptable");
assert.deepEqual(
  bookingSequenceTypesFor("meeting-comptable", "comptable"),
  ["immediate", "h48_confirm", "h24_relance"],
);

for (const niche of ALL_NICHES) {
  const live = bookingsSequenceTabsForNiche(niche);
  assert.equal(
    live.length,
    EXPECTED_BOOKING_TAB_IDS.length,
    `${niche} should expose all booking sequence tabs`,
  );
  for (const tabId of EXPECTED_BOOKING_TAB_IDS) {
    assert.ok(
      live.some((tab) => tab.id === tabId),
      `${niche} missing tab ${tabId}`,
    );
  }
}

for (const niche of ALL_NICHES) {
  const confirmTab = BOOKINGS_SEQUENCE_TABS.find((tab) => tab.id === "confirm");
  assert.ok(confirmTab);
  assert.equal(isBookingsSequenceTabLive(confirmTab, niche), true);
  const entry = resolveBookingsSequenceEntry(confirmTab, niche);
  assert.ok(entry, `confirm entry for ${niche}`);
  assert.equal(entry?.slug, meetingSequenceSlugForNiche(niche));
}

const reminders = BOOKINGS_SEQUENCE_TABS.find((tab) => tab.id === "reminders");
assert.ok(reminders);
for (const niche of ALL_NICHES) {
  assert.equal(isBookingsSequenceTabLive(reminders, niche), true);
}

console.log("bookings-sequence-tabs.test.ts: ok");
