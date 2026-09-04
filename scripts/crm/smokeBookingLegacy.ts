import assert from "node:assert/strict";

import { isLegacyAgenceLead } from "@/lib/booking-communication/legacy";

const goLive = new Date("2026-09-03T14:00:00.000Z").getTime();
process.env.BOOKING_GO_LIVE_AT = "2026-09-03T14:00:00.000Z";

assert.equal(
  isLegacyAgenceLead("agence", { booked_at: new Date(goLive - 1000).toISOString() }),
  true,
);
assert.equal(
  isLegacyAgenceLead("agence", { booked_at: new Date(goLive + 1000).toISOString() }),
  false,
);
assert.equal(isLegacyAgenceLead("agence", { booked_at: null }), true);
assert.equal(
  isLegacyAgenceLead("entreprise", { booked_at: new Date(goLive - 1000).toISOString() }),
  false,
);

console.log("booking legacy cutoff smoke passed");
