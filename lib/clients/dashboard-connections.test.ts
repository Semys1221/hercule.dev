/** Unit tests for client dashboard connection flags. */

import assert from "node:assert/strict";

import {
  isCalendarConnected,
  isCalendlyBookingsEnabled,
} from "./dashboard-connections";

assert.equal(isCalendarConnected(null), true);
assert.equal(isCalendarConnected({}), true);
assert.equal(isCalendarConnected({ calendar_connected: false }), false);
assert.equal(isCalendarConnected({ calendar_connected: true }), true);
assert.equal(isCalendarConnected({ calendar_connected: "yes" }), true);

assert.equal(isCalendlyBookingsEnabled(null), false);
assert.equal(isCalendlyBookingsEnabled({}), false);
assert.equal(isCalendlyBookingsEnabled({ calendly_bookings_enabled: true }), true);
assert.equal(isCalendlyBookingsEnabled({ calendly_bookings_enabled: false }), false);

console.log("dashboard-connections.test.ts: ok");
