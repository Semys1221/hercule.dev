/** Unit tests for booking confirmation kill switch. */

import assert from "node:assert/strict";

import {
  BOOKING_CONFIRMATION_DISABLED,
  DISABLED_MEETING_CONFIRMATION_TYPES,
  bookingConfirmationDisabledResponse,
  isDisabledMeetingConfirmationType,
} from "@/lib/booking-communication/confirmation-disabled";

function main() {
  assert.equal(BOOKING_CONFIRMATION_DISABLED, true);
  assert.ok(DISABLED_MEETING_CONFIRMATION_TYPES.includes("h20_cancel"));
  assert.ok(DISABLED_MEETING_CONFIRMATION_TYPES.includes("modalites_enforce_cancel"));
  assert.ok(isDisabledMeetingConfirmationType("h48_confirm"));
  assert.ok(!isDisabledMeetingConfirmationType("onboarding_j0"));
  assert.deepEqual(bookingConfirmationDisabledResponse(), {
    error: "booking_confirmation_disabled",
  });

  console.log("confirmation-disabled.test.ts: ok");
}

main();
