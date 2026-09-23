/** Unit tests for client dashboard connection flags. */

import assert from "node:assert/strict";

import {
  isCalendarConnected,
  isClientCalendarConnected,
  isCalendlyBookingsEnabled,
  isCalendlySeatConnected,
} from "./dashboard-connections";

assert.equal(isCalendarConnected(null), false);
assert.equal(isCalendarConnected({}), false);
assert.equal(isCalendarConnected({ calendar_connected: false }), false);
assert.equal(isCalendarConnected({ calendar_connected: true }), true);

assert.equal(
  isClientCalendarConnected({
    profile: {},
    calendlySeat: { status: "awaiting_invite", invitationStatus: null },
  }),
  false,
);
assert.equal(
  isClientCalendarConnected({
    profile: {},
    calendlySeat: { status: "active", invitationStatus: null },
  }),
  true,
);
assert.equal(
  isClientCalendarConnected({
    profile: {},
    calendlySeat: { status: "invite_pending", invitationStatus: "accepted" },
  }),
  true,
);
assert.equal(
  isClientCalendarConnected({
    profile: { calendar_connected: true },
    calendlySeat: { status: "awaiting_invite", invitationStatus: null },
  }),
  true,
);
assert.equal(
  isClientCalendarConnected({
    profile: null,
    calendlySeat: null,
  }),
  false,
);

assert.equal(isCalendlySeatConnected(null), false);
assert.equal(
  isCalendlySeatConnected({ status: "active", invitationStatus: null }),
  true,
);

assert.equal(isCalendlyBookingsEnabled(null), false);
assert.equal(isCalendlyBookingsEnabled({}), false);
assert.equal(isCalendlyBookingsEnabled({ calendly_bookings_enabled: true }), true);
assert.equal(isCalendlyBookingsEnabled({ calendly_bookings_enabled: false }), false);

console.log("dashboard-connections.test.ts: ok");
