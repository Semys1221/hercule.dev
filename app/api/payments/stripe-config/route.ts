import { NextResponse } from "next/server";

import { getStripePublishableKey, getStripeSecretKey } from "@/lib/env";
import {
  assertStripeKeyPair,
  stripeKeyAccountId,
  stripeKeyMode,
} from "@/lib/payments/stripe-keys";

function stripePublishableKeySource(): string | null {
  if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()) {
    return "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY";
  }
  if (process.env.STRIPE_PUBLISHABLE_KEY?.trim()) {
    return "STRIPE_PUBLISHABLE_KEY";
  }
  return null;
}

export async function GET() {
  const secretKey = getStripeSecretKey();
  const publishableKey = getStripePublishableKey();
  const publishableSource = stripePublishableKeySource();

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c1b414" },
    body: JSON.stringify({
      sessionId: "c1b414",
      runId: "pre-fix",
      hypothesisId: "A,B",
      location: "stripe-config/route.ts:GET",
      message: "Stripe key pair check",
      data: {
        secretMode: secretKey ? stripeKeyMode(secretKey) : null,
        publishableMode: publishableKey ? stripeKeyMode(publishableKey) : null,
        secretAccount: secretKey ? stripeKeyAccountId(secretKey) : null,
        publishableAccount: publishableKey ? stripeKeyAccountId(publishableKey) : null,
        publishableSource,
        hasSecret: Boolean(secretKey),
        hasPublishable: Boolean(publishableKey),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (!publishableKey) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set" },
      { status: 500 },
    );
  }

  try {
    if (secretKey) {
      assertStripeKeyPair(secretKey, publishableKey);
    }
  } catch (error) {
    const base = error instanceof Error ? error.message : "Stripe key mismatch";
    const message =
      publishableSource && base.includes("mode mismatch")
        ? `${base} (publishable from ${publishableSource})`
        : base;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ publishableKey });
}
