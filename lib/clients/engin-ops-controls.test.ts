import assert from "node:assert/strict";

import { clientNeedsOps, clientOpsControls } from "./engin-ops-controls";

const controls = clientOpsControls({
  client: {
    onboarding_completed_at: "2026-01-01T00:00:00.000Z",
    calendly_scheduling_url: "https://calendly.com/a/30",
    profile: { calendar_connected: true },
  },
  eligibility: "eligible",
  hasSucceededPayment: true,
});

assert.equal(clientNeedsOps(controls), false);

const missing = clientOpsControls({
  client: {
    onboarding_completed_at: null,
    calendly_scheduling_url: null,
    profile: {},
  },
  eligibility: "not_onboarded",
  hasSucceededPayment: false,
});

assert.equal(clientNeedsOps(missing), true);
assert.equal(missing.find((item) => item.id === "calendly")?.ok, false);

console.log("engin-ops-controls.test.ts: ok");
