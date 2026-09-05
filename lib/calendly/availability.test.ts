/** Unit tests for Calendly availability summary and date formatting. */

import assert from "node:assert/strict";

import {
  buildAvailabilitySummary,
  formatFrenchDateLabel,
  parseBookingEvent,
} from "@/lib/calendly/availability";

function main() {
  assert.equal(parseBookingEvent("agence"), "agence");
  assert.equal(parseBookingEvent("entreprise"), "entreprise");
  assert.equal(parseBookingEvent("invalid"), null);
  assert.equal(parseBookingEvent(null), null);

  const now = new Date("2026-09-05T10:00:00.000Z");
  const slotSoon = new Date("2026-09-06T10:00:00.000Z");
  const slotLater = new Date("2026-09-12T10:00:00.000Z");

  const soonSummary = buildAvailabilitySummary(slotSoon, now);
  assert.equal(soonSummary.isFullyBooked, false);

  const laterSummary = buildAvailabilitySummary(slotLater, now);
  assert.equal(laterSummary.isFullyBooked, true);
  assert.equal(laterSummary.fullFromLabel, "5 septembre");
  assert.equal(laterSummary.fullUntilLabel, "11 septembre");
  assert.equal(laterSummary.nextAvailableLabel, "12 septembre");
  assert.equal(
    laterSummary.message.prefix,
    "Nous sommes actuellement complets du ",
  );
  assert.equal(laterSummary.message.fullFrom, "5 septembre");
  assert.equal(laterSummary.message.fullUntil, "11 septembre");
  assert.equal(laterSummary.message.nextAvailable, "12 septembre");

  const emptySummary = buildAvailabilitySummary(null, now);
  assert.equal(emptySummary.isFullyBooked, true);
  assert.equal(emptySummary.noSlotsInHorizon, true);
  assert.match(
    emptySummary.message.prefix,
    /Agenda complet pour le moment/,
  );

  assert.equal(
    formatFrenchDateLabel(new Date("2026-09-18T22:00:00.000Z")),
    "19 septembre",
  );

  console.log("OK lib/calendly/availability.test.ts");
}

main();
