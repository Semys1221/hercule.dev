import { getStripePublishableKey, getStripeSecretKey } from "@/lib/env";

/** Stripe account id embedded in sk_/pk_ keys (e.g. 51FakeAccountPref). */
export function stripeKeyAccountId(key: string): string | null {
  const body = stripeKeyBody(key);
  if (!body) {
    return null;
  }
  // Keys from the same Stripe account share a fixed-length account prefix.
  return body.slice(0, 17);
}

function stripeKeyBody(key: string): string | null {
  const match = key.trim().match(/^(?:sk|pk)_(?:live|test)_(.+)$/);
  return match?.[1] ?? null;
}

export function stripeKeyMode(key: string): "live" | "test" | null {
  if (key.includes("_live_")) {
    return "live";
  }
  if (key.includes("_test_")) {
    return "test";
  }
  return null;
}

export function assertStripeKeyPair(secretKey: string, publishableKey: string): void {
  const secretAccount = stripeKeyAccountId(secretKey);
  const publishableAccount = stripeKeyAccountId(publishableKey);
  const secretMode = stripeKeyMode(secretKey);
  const publishableMode = stripeKeyMode(publishableKey);

  if (!secretAccount || !publishableAccount || !secretMode || !publishableMode) {
    throw new Error("Invalid Stripe API key format");
  }

  if (secretMode !== publishableMode) {
    throw new Error(
      `Stripe key mode mismatch: secret is ${secretMode}, publishable is ${publishableMode}`,
    );
  }

  if (secretAccount !== publishableAccount) {
    throw new Error(
      `Stripe account mismatch: secret account ${secretAccount} ≠ publishable account ${publishableAccount}`,
    );
  }
}

export function getValidatedStripePublishableKey(): string {
  const secretKey = getStripeSecretKey();
  const publishableKey = getStripePublishableKey();

  if (!publishableKey) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
  }

  if (secretKey) {
    assertStripeKeyPair(secretKey, publishableKey);
  }

  return publishableKey;
}
