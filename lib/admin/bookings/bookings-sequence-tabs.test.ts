/** Unit tests for Bookings → Séquences tab matrix (Phase 4 §6.3). */

import assert from "node:assert/strict";

import {
  BOOKINGS_SEQUENCE_TABS,
  bookingsSequenceTabsForNiche,
  isBookingsSequenceTabLive,
  resolveBookingsSequenceEntry,
} from "@/lib/admin/bookings/bookings-sequence-tabs";
import {
  bookingSequenceTypesFor,
  getEmailSequence,
  meetingSequenceSlugForNiche,
} from "@/lib/admin/email-sequences/registry";

assert.equal(meetingSequenceSlugForNiche("agence"), "meeting-agence");
assert.equal(meetingSequenceSlugForNiche("comptable"), "meeting-comptable");
assert.equal(meetingSequenceSlugForNiche("entreprise"), "meeting-entreprise");

const comptableMeeting = getEmailSequence("meeting-comptable");
assert.ok(comptableMeeting);
assert.equal(comptableMeeting?.bookingCategory, "comptable");
assert.deepEqual(
  bookingSequenceTypesFor("meeting-comptable", "comptable"),
  ["immediate", "h48_confirm", "h24_relance", "h20_cancel"],
);

const agenceLive = bookingsSequenceTabsForNiche("agence");
assert.equal(agenceLive.length, 7);
assert.ok(agenceLive.some((tab) => tab.id === "confirm"));
assert.ok(agenceLive.some((tab) => tab.id === "reminders"));

const comptableLive = bookingsSequenceTabsForNiche("comptable");
assert.equal(comptableLive.length, 4);
assert.ok(comptableLive.some((tab) => tab.id === "confirm"));
assert.ok(!comptableLive.some((tab) => tab.id === "reminders"));

const entrepriseLive = bookingsSequenceTabsForNiche("entreprise");
assert.equal(entrepriseLive.length, 4);
assert.ok(entrepriseLive.some((tab) => tab.id === "confirm"));
assert.ok(!entrepriseLive.some((tab) => tab.id === "not-paid"));

for (const niche of ["agence", "comptable", "entreprise"] as const) {
  const confirmTab = BOOKINGS_SEQUENCE_TABS.find((tab) => tab.id === "confirm");
  assert.ok(confirmTab);
  assert.equal(isBookingsSequenceTabLive(confirmTab, niche), true);
  const entry = resolveBookingsSequenceEntry(confirmTab, niche);
  assert.ok(entry, `confirm entry for ${niche}`);
  assert.equal(entry?.slug, meetingSequenceSlugForNiche(niche));
}

const reminders = BOOKINGS_SEQUENCE_TABS.find((tab) => tab.id === "reminders");
assert.ok(reminders);
assert.equal(isBookingsSequenceTabLive(reminders, "agence"), true);
assert.equal(isBookingsSequenceTabLive(reminders, "comptable"), false);
assert.equal(isBookingsSequenceTabLive(reminders, "entreprise"), false);

console.log("bookings-sequence-tabs.test.ts: ok");
