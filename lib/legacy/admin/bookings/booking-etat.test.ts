/** Unit tests for booking état resolution. */

import assert from "node:assert/strict";

import { resolveBookingEtat } from "@/lib/legacy/admin/bookings/booking-etat";

function main() {
  assert.deepEqual(resolveBookingEtat("CONFIRMED", "paid"), {
    label: "Payé",
    variant: "secondary",
  });
  assert.deepEqual(resolveBookingEtat("MEETING_BOOKED", "no_show"), {
    label: "Absent",
    variant: "destructive",
  });
  assert.deepEqual(resolveBookingEtat("CONFIRMED", null), {
    label: "Confirmé",
    variant: "default",
  });
  assert.deepEqual(resolveBookingEtat("NOTBOOKED", null), {
    label: "Non booké",
    variant: "outline",
  });
  assert.deepEqual(resolveBookingEtat("CONFIRMED", "lost"), {
    label: "Perdu",
    variant: "destructive",
  });
  assert.deepEqual(resolveBookingEtat("CONFIRMED", "lost", "unqualified"), {
    label: "Unqualified",
    variant: "outline",
  });
  assert.deepEqual(resolveBookingEtat("MEETING_BOOKED", null, null, true), {
    label: "Annulé",
    variant: "destructive",
  });
  assert.deepEqual(resolveBookingEtat("CANCELLED", null), {
    label: "Annulé",
    variant: "destructive",
  });

  console.log("booking état tests passed");
}

main();
