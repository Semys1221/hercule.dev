import assert from "node:assert/strict";

import {
  E1_WEBHOOK_HUMAN_DELAY_MS,
  e1WebhookScheduledFor,
  shouldBypassSendWindow,
} from "@/lib/instantly-bypass/constants";

function testE1WebhookScheduledFor() {
  const receivedAt = new Date("2026-03-15T14:03:00.000Z");
  const scheduled = e1WebhookScheduledFor(receivedAt);
  assert.equal(
    scheduled.getTime() - receivedAt.getTime(),
    E1_WEBHOOK_HUMAN_DELAY_MS,
  );
  assert.equal(E1_WEBHOOK_HUMAN_DELAY_MS, 15 * 60 * 1000);
  console.log("OK e1WebhookScheduledFor adds 15 minutes");
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
