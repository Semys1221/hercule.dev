/** Unit tests for booking stats. */

import assert from "node:assert/strict";

import {
  computeBookingRate,
  computeBookingStats,
  computeExtendedBookingStats,
  formatBookingPercent,
} from "@/lib/admin/bookings/stats";

const NOW = Date.parse("2026-09-08T12:00:00.000Z");

function main() {
  const stats = computeBookingStats(
    [
      { startTime: "2026-09-01T10:00:00.000Z", salesCallStatus: "no_show" },
      { startTime: "2026-09-02T10:00:00.000Z", salesCallStatus: "paid" },
      { startTime: "2026-09-03T10:00:00.000Z", salesCallStatus: "scheduled" },
      { startTime: "2026-09-10T10:00:00.000Z", salesCallStatus: null },
    ],
    NOW,
  );

  assert.equal(stats.totalBooked, 4);
  assert.equal(stats.pastBooked, 3);
  assert.equal(stats.noShowCount, 1);
  assert.equal(stats.noShowPercent, 33.3);
  assert.equal(stats.soldCount, 1);
  assert.equal(stats.soldPercent, 33.3);
  assert.equal(formatBookingPercent(null), "—");
  assert.equal(formatBookingPercent(42), "42 %");

  const emptyPast = computeBookingStats(
    [{ startTime: "2026-09-10T10:00:00.000Z", salesCallStatus: null }],
    NOW,
  );
  assert.equal(emptyPast.pastBooked, 0);
  assert.equal(emptyPast.noShowPercent, null);
  assert.equal(emptyPast.soldPercent, null);

  assert.equal(computeBookingRate(29, 3600), 0.8);
  assert.equal(computeBookingRate(29, 0), null);

  const extended = computeExtendedBookingStats(
    [{ startTime: "2026-09-01T10:00:00.000Z", salesCallStatus: null }],
    { sent: 100, replies: 10, interested: 5 },
    NOW,
  );
  assert.equal(extended.bookingRate, 1);
  assert.equal(extended.replyPercent, 10);
  assert.equal(extended.positivePercent, 5);

  console.log("booking stats tests passed");
}

main();
