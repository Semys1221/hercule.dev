import { describe, expect, it } from "vitest";

import { assertStripeKeyPair, stripeKeyAccountId, stripeKeyMode } from "./stripe-keys";

/** Synthetic keys for unit tests — never use real Stripe credentials in source control. */
const FAKE_LIVE_ACCOUNT = "51FakeAccountPref";
const FAKE_TEST_ACCOUNT = "51TestAccountPref";

const LIVE_SECRET = `sk_live_${FAKE_LIVE_ACCOUNT}SecretKeySuffix1234567890`;
const LIVE_PUBLISHABLE = `pk_live_${FAKE_LIVE_ACCOUNT}PublishableSuffix123456`;
const TEST_PUBLISHABLE = `pk_test_${FAKE_TEST_ACCOUNT}TestPublishableSuffix1234`;

describe("stripe-keys", () => {
  it("extracts matching account ids for live key pair", () => {
    expect(stripeKeyAccountId(LIVE_SECRET)).toBe(FAKE_LIVE_ACCOUNT);
    expect(stripeKeyAccountId(LIVE_PUBLISHABLE)).toBe(FAKE_LIVE_ACCOUNT);
    expect(stripeKeyMode(LIVE_SECRET)).toBe("live");
    expect(stripeKeyMode(LIVE_PUBLISHABLE)).toBe("live");
  });

  it("accepts matching live secret/publishable pair", () => {
    expect(() => assertStripeKeyPair(LIVE_SECRET, LIVE_PUBLISHABLE)).not.toThrow();
  });

  it("rejects live secret with test publishable key", () => {
    expect(() => assertStripeKeyPair(LIVE_SECRET, TEST_PUBLISHABLE)).toThrow(/mode mismatch/i);
  });
});
