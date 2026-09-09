/** Unit tests for deliverability scoring helpers. */

import assert from "node:assert/strict";

import {
  computeInboxRate,
  scoreAccountHealth,
} from "@/lib/admin/deliverability/scoring";
import { DEFAULT_DELIVERABILITY_SETTINGS } from "@/lib/admin/deliverability/types";

assert.equal(computeInboxRate({ landedInbox: 85, landedSpam: 15 }), 0.85);
assert.equal(computeInboxRate({ landedInbox: 0, landedSpam: 0 }), null);

assert.equal(
  scoreAccountHealth({
    status: 1,
    warmupStatus: 1,
    warmup: {
      sent: 100,
      received: 100,
      landedInbox: 95,
      landedSpam: 5,
      healthScore: 95,
      healthScoreLabel: "Good",
      inboxRate: 0.95,
    },
    vitals: {
      domain: "example.com",
      allPass: true,
      mx: true,
      spf: true,
      dkim: true,
      dmarc: true,
    },
    settings: DEFAULT_DELIVERABILITY_SETTINGS,
  }),
  "healthy",
);

assert.equal(
  scoreAccountHealth({
    status: 2,
    warmupStatus: 1,
    warmup: {
      sent: 100,
      received: 100,
      landedInbox: 95,
      landedSpam: 5,
      healthScore: 95,
      healthScoreLabel: "Good",
      inboxRate: 0.95,
    },
    vitals: null,
    settings: DEFAULT_DELIVERABILITY_SETTINGS,
  }),
  "paused",
);

assert.equal(
  scoreAccountHealth({
    status: 1,
    warmupStatus: 1,
    warmup: {
      sent: 100,
      received: 100,
      landedInbox: 50,
      landedSpam: 50,
      healthScore: 60,
      healthScoreLabel: "Low",
      inboxRate: 0.5,
    },
    vitals: {
      domain: "example.com",
      allPass: false,
      mx: true,
      spf: false,
      dkim: true,
      dmarc: true,
    },
    settings: DEFAULT_DELIVERABILITY_SETTINGS,
  }),
  "critical",
);

console.log("deliverability scoring tests passed");
