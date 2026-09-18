import assert from "node:assert/strict";

import { BOOKING_CONFIRMATION_DISABLED } from "@/lib/booking-communication/confirmation-disabled";
import { isMeetingSequenceSlug } from "@/lib/admin/management/recipients/phase-map";

assert.equal(BOOKING_CONFIRMATION_DISABLED, true);

function wouldRejectMeetingStart(sequenceSlug: string): boolean {
  return BOOKING_CONFIRMATION_DISABLED && isMeetingSequenceSlug(sequenceSlug);
}

assert.equal(wouldRejectMeetingStart("meeting-comptable"), true);
assert.equal(wouldRejectMeetingStart("meeting-cif"), true);
assert.equal(wouldRejectMeetingStart("role-recovery"), true);
assert.equal(wouldRejectMeetingStart("onboarding-sequence"), false);
assert.equal(wouldRejectMeetingStart("subsequence-interested"), false);

console.log("start.test.ts: ok");
