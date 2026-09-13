/** Unit tests for list bookings helpers. */

import assert from "node:assert/strict";

import {
  bookingsPipelineBlockedByMissingEventType,
  buildScheduledEventsListParams,
  isCalendlyBookingCanceled,
  mergeScheduledEventsByUri,
} from "@/lib/calendly/list-bookings";

const base = {
  userUri: "https://api.calendly.com/users/ABC",
  minTime: "2026-01-01T00:00:00.000Z",
  maxTime: "2026-02-01T00:00:00.000Z",
};

const withEvent = buildScheduledEventsListParams({
  ...base,
  eventTypeUri: "https://api.calendly.com/event_types/XYZ",
});

assert.equal(withEvent.event_type, "https://api.calendly.com/event_types/XYZ");
assert.equal(withEvent.user, base.userUri);
assert.equal(withEvent.status, "active");

const canceled = buildScheduledEventsListParams({ ...base, status: "canceled" });
assert.equal(canceled.status, "canceled");

const merged = mergeScheduledEventsByUri([
  { uri: "https://api.calendly.com/scheduled_events/A", status: "active" },
  { uri: "https://api.calendly.com/scheduled_events/A", status: "canceled" },
  { uri: "https://api.calendly.com/scheduled_events/B", status: "canceled" },
]);
assert.equal(merged.length, 2);

assert.equal(
  isCalendlyBookingCanceled({ event_status: "active", invitee_status: "canceled" }),
  true,
);
assert.equal(
  isCalendlyBookingCanceled({ event_status: "active", invitee_status: "active" }),
  false,
);

const withoutEvent = buildScheduledEventsListParams(base);
assert.equal(withoutEvent.event_type, undefined);

const emptyUri = buildScheduledEventsListParams({ ...base, eventTypeUri: null });
assert.equal(emptyUri.event_type, undefined);

assert.equal(
  bookingsPipelineBlockedByMissingEventType("comptable", undefined),
  true,
);
assert.equal(
  bookingsPipelineBlockedByMissingEventType("comptable", "https://api.calendly.com/event_types/X"),
  false,
);
assert.equal(bookingsPipelineBlockedByMissingEventType(undefined, undefined), false);

console.log("list-bookings event filter tests passed");
