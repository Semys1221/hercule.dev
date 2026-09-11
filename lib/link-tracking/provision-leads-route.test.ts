/** Unit tests for POST /api/link-tracking/provision-leads auth. */

import assert from "node:assert/strict";

import { verifyProvisionLeadsSecret } from "@/app/api/link-tracking/provision-leads/route";

const previousCron = process.env.CRON_SECRET;
const previousWebhook = process.env.LINK_TRACKING_WEBHOOK_SECRET;

process.env.CRON_SECRET = "test-secret";
delete process.env.LINK_TRACKING_WEBHOOK_SECRET;

assert.equal(
  verifyProvisionLeadsSecret(
    new Request("http://localhost/api/link-tracking/provision-leads", {
      headers: { authorization: "Bearer test-secret" },
    }),
  ),
  true,
);

assert.equal(
  verifyProvisionLeadsSecret(
    new Request("http://localhost/api/link-tracking/provision-leads"),
  ),
  false,
);

assert.equal(
  verifyProvisionLeadsSecret(
    new Request("http://localhost/api/link-tracking/provision-leads", {
      headers: { authorization: "Bearer wrong" },
    }),
  ),
  false,
);

delete process.env.CRON_SECRET;
assert.equal(
  verifyProvisionLeadsSecret(
    new Request("http://localhost/api/link-tracking/provision-leads", {
      headers: { authorization: "Bearer test-secret" },
    }),
  ),
  false,
);

if (previousCron === undefined) {
  delete process.env.CRON_SECRET;
} else {
  process.env.CRON_SECRET = previousCron;
}
if (previousWebhook === undefined) {
  delete process.env.LINK_TRACKING_WEBHOOK_SECRET;
} else {
  process.env.LINK_TRACKING_WEBHOOK_SECRET = previousWebhook;
}

console.log("OK provision-leads route auth tests passed");
