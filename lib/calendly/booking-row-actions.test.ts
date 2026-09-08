/** Unit tests for bookings table action visibility. */

import assert from "node:assert/strict";

import { bookingRowActionState } from "@/lib/calendly/booking-row-actions";

function main() {
  assert.deepEqual(bookingRowActionState(null), {
    badge: null,
    isPaid: false,
    isNoShow: false,
    canToggleNoShow: true,
    showNoShow: true,
    showNotPaid: true,
    showNotPresent: true,
    showResetNoShow: false,
  });
  assert.deepEqual(bookingRowActionState("scheduled"), {
    badge: null,
    isPaid: false,
    isNoShow: false,
    canToggleNoShow: true,
    showNoShow: true,
    showNotPaid: true,
    showNotPresent: true,
    showResetNoShow: false,
  });
  assert.deepEqual(bookingRowActionState("completed"), {
    badge: null,
    isPaid: false,
    isNoShow: false,
    canToggleNoShow: true,
    showNoShow: true,
    showNotPaid: true,
    showNotPresent: true,
    showResetNoShow: false,
  });
  assert.deepEqual(bookingRowActionState("paid"), {
    badge: "PAID",
    isPaid: true,
    isNoShow: false,
    canToggleNoShow: false,
    showNoShow: false,
    showNotPaid: false,
    showNotPresent: false,
    showResetNoShow: false,
  });
  assert.deepEqual(bookingRowActionState("no_show"), {
    badge: "NO SHOW",
    isPaid: false,
    isNoShow: true,
    canToggleNoShow: true,
    showNoShow: false,
    showNotPaid: false,
    showNotPresent: false,
    showResetNoShow: true,
  });
  assert.deepEqual(bookingRowActionState("not_paid"), {
    badge: "NON PAYÉ",
    isPaid: false,
    isNoShow: false,
    canToggleNoShow: true,
    showNoShow: false,
    showNotPaid: false,
    showNotPresent: false,
    showResetNoShow: false,
  });
  console.log("booking-row-actions tests passed");
}

main();
