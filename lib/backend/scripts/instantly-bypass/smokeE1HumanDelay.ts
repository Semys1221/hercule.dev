import assert from "node:assert/strict";

import {
  E1_WEBHOOK_DEFAULT_DELAY_MS,
  RESTAURANT_DCE_E1_WEBHOOK_DELAY_MS,
  e1WebhookScheduledFor,
  resolveE1WebhookDelayMs,
  shouldBypassSendWindow,
} from "@/lib/legacy/instantly-bypass/constants";

function testE1WebhookScheduledFor() {
  const receivedAt = new Date("2026-03-15T14:03:00.000Z");
  const immediate = e1WebhookScheduledFor(receivedAt, E1_WEBHOOK_DEFAULT_DELAY_MS);
  assert.equal(immediate.getTime(), receivedAt.getTime());

  const delayed = e1WebhookScheduledFor(receivedAt, RESTAURANT_DCE_E1_WEBHOOK_DELAY_MS);
  assert.equal(
    delayed.getTime() - receivedAt.getTime(),
    RESTAURANT_DCE_E1_WEBHOOK_DELAY_MS,
  );

  assert.equal(resolveE1WebhookDelayMs({ campaign_id: "x", e1_webhook_delay_ms: 300_000 }), 300_000);
  assert.equal(resolveE1WebhookDelayMs({ campaign_id: "x" }), E1_WEBHOOK_DEFAULT_DELAY_MS);
  console.log("OK e1WebhookScheduledFor + resolveE1WebhookDelayMs");
}

function testShouldBypassSendWindow() {
  assert.equal(shouldBypassSendWindow({ bypass_send_window: true }), true);
  assert.equal(shouldBypassSendWindow({ bypass_send_window: false }), false);
  assert.equal(shouldBypassSendWindow({}), false);
  assert.equal(shouldBypassSendWindow(null), false);
  assert.equal(shouldBypassSendWindow(undefined), false);
  console.log("OK shouldBypassSendWindow");
}

function main() {
  testE1WebhookScheduledFor();
  testShouldBypassSendWindow();
  console.log("All E1 human delay smoke tests passed.");
}

main();
