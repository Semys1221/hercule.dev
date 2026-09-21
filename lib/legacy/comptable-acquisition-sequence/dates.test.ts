/** Unit tests for comptable acquisition sequence date helpers. */

import assert from "node:assert/strict";

import {
  acquisitionRdvRangeLabel,
  estimatedFirstRdvAtFromPayment,
  formatEstimatedFirstRdvDate,
  trackingNumberForSlug,
} from "@/lib/legacy/comptable-acquisition-sequence/dates";

function main() {
  assert.equal(trackingNumberForSlug("abc123"), "HRC-abc123");
  assert.equal(acquisitionRdvRangeLabel(), "10 à 15");

  const paymentAt = new Date("2026-09-16T12:00:00.000Z");
  const estimated = estimatedFirstRdvAtFromPayment(paymentAt);
  assert.equal(
    estimated.getTime() - paymentAt.getTime(),
    25 * 24 * 60 * 60 * 1000,
  );

  const formatted = formatEstimatedFirstRdvDate(paymentAt);
  assert.ok(formatted.length > 5);
  assert.ok(!formatted.includes("convenue"));

  console.log("comptable-acquisition-sequence/dates.test.ts: ok");
}

main();
