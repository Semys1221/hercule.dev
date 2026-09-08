import assert from "node:assert/strict";

import {
  buildComptableLeadUrls,
  buildInstantlyCustomVariables,
  getTrackingBaseUrl,
} from "./urls";

const urls = buildComptableLeadUrls("abc123", "cab@test.fr");
assert.ok(urls.reservation_comptable_link.includes("abc123"));
assert.ok(urls.confirmation_comptable_link.includes("abc123"));
assert.ok(urls.confirmation_comptable_link.includes("email="));
assert.ok(urls.dashboard_link.includes("abc123"));

assert.equal(getTrackingBaseUrl("comptable"), getTrackingBaseUrl("comptable"));

const instantly = buildInstantlyCustomVariables("abc123", "cab@test.fr", "NOTBOOKED", "comptable");
assert.equal(
  instantly.reservation_entreprise_link,
  urls.reservation_comptable_link,
);
assert.equal(
  instantly.confirmation_agence_link,
  urls.confirmation_comptable_link,
);

console.log("urls-comptable.test.ts: ok");
