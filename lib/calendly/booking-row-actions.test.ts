/** Unit tests for bookings table action visibility. */

import assert from "node:assert/strict";

import { bookingRowActionState } from "@/lib/calendly/booking-row-actions";

function main() {
  assert.deepEqual(bookingRowActionState(null), {
    badge: null,
    showNoShow: true,
    showNotPaid: true,
    showNotPresent: true,
    showResetNoShow: false,
  });
  assert.deepEqual(bookingRowActionState("scheduled"), {
    badge: null,
    showNoShow: true,
    showNotPaid: true,
    showNotPresent: true,
    showResetNoShow: false,
  });
  assert.deepEqual(bookingRowActionState("completed"), {
    badge: null,
    showNoShow: true,
    showNotPaid: true,
    showNotPresent: true,
    showResetNoShow: false,
  });
  assert.deepEqual(bookingRowActionState("paid"), {
    badge: "PAID",
    showNoShow: false,
    showNotPaid: false,
    showNotPresent: false,
    showResetNoShow: false,
  });
  assert.deepEqual(bookingRowActionState("no_show"), {
    badge: "NO SHOW",
    showNoShow: false,
    showNotPaid: false,
    showNotPresent: false,
    showResetNoShow: true,
  });
  assert.deepEqual(bookingRowActionState("not_paid"), {
    badge: "NON PAYÉ",
    showNoShow: false,
    showNotPaid: false,
    showNotPresent: false,
    showResetNoShow: false,
  });
  console.log("booking-row-actions tests passed");
}

main();
