/** Unit tests for event-type filtering params in list bookings. */

import assert from "node:assert/strict";

function buildScheduledEventsParams(options: {
  userUri: string;
  minTime: string;
  maxTime: string;
  eventTypeUri?: string | null;
}): Record<string, string> {
  const params: Record<string, string> = {
    user: options.userUri,
    status: "active",
    min_start_time: options.minTime,
    max_start_time: options.maxTime,
    count: "100",
  };
  if (options.eventTypeUri) {
    params.event_type = options.eventTypeUri;
  }
  return params;
}

const params = buildScheduledEventsParams({
  userUri: "https://api.calendly.com/users/ABC",
  minTime: "2026-01-01T00:00:00.000Z",
  maxTime: "2026-02-01T00:00:00.000Z",
  eventTypeUri: "https://api.calendly.com/event_types/XYZ",
});

assert.equal(params.event_type, "https://api.calendly.com/event_types/XYZ");

const withoutEvent = buildScheduledEventsParams({
  userUri: "https://api.calendly.com/users/ABC",
  minTime: "2026-01-01T00:00:00.000Z",
  maxTime: "2026-02-01T00:00:00.000Z",
});

assert.equal(withoutEvent.event_type, undefined);

console.log("list-bookings event filter tests passed");
