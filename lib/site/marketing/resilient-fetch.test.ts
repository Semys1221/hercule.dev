import assert from "node:assert/strict";
import test from "node:test";

import { withMarketingFetchFallback } from "./resilient-fetch";

test("withMarketingFetchFallback returns data on first success", async () => {
  let attempts = 0;
  const result = await withMarketingFetchFallback(
    "test success",
    async () => {
      attempts += 1;
      return ["row"];
    },
    [],
  );

  assert.deepEqual(result, ["row"]);
  assert.equal(attempts, 1);
});

test("withMarketingFetchFallback retries transient errors then succeeds", async () => {
  let attempts = 0;
  const result = await withMarketingFetchFallback(
    "test retry",
    async () => {
      attempts += 1;
      if (attempts < 2) {
        throw new Error("Failed to fetch demandes: Gateway Timeout");
      }
      return ["row"];
    },
    [],
  );

  assert.deepEqual(result, ["row"]);
  assert.equal(attempts, 2);
});

test("withMarketingFetchFallback uses fallback after transient retries are exhausted", async () => {
  let attempts = 0;
  const result = await withMarketingFetchFallback(
    "test fallback",
    async () => {
      attempts += 1;
      throw new Error("Failed to fetch demandes: Gateway Timeout");
    },
    [],
  );

  assert.deepEqual(result, []);
  assert.equal(attempts, 3);
});

test("withMarketingFetchFallback does not retry non-transient errors", async () => {
  let attempts = 0;
  const result = await withMarketingFetchFallback(
    "test non-transient",
    async () => {
      attempts += 1;
      throw new Error("permission denied for table agence_demandes");
    },
    null,
  );

  assert.equal(result, null);
  assert.equal(attempts, 1);
});
