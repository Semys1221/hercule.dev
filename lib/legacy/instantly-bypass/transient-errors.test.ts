import assert from "node:assert/strict";
import test from "node:test";

import {
  isTransientBypassError,
  retryBackoffMs,
  retryCountFromPayload,
} from "./transient-errors";

test("isTransientBypassError detects gateway timeouts", () => {
  assert.equal(
    isTransientBypassError(
      "Failed to load template interested_email1: Gateway Timeout",
    ),
    true,
  );
  assert.equal(isTransientBypassError("Missing reservation link on lead"), false);
});

test("retryBackoffMs grows with retry count", () => {
  assert.equal(retryBackoffMs(1), 60_000);
  assert.equal(retryBackoffMs(5), 300_000);
});

test("retryCountFromPayload reads payload retry_count", () => {
  assert.equal(retryCountFromPayload({ retry_count: 2 }), 2);
  assert.equal(retryCountFromPayload({}), 0);
});
