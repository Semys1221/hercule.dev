"use client";

import { useCallback, useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

type StepEmbeddedCheckoutProps = {
  slug: string;
  clientSecret?: string | null;
  preloadError?: string | null;
};

export function StepEmbeddedCheckout({
  slug,
  clientSecret: preloadedClientSecret,
  preloadError,
}: StepEmbeddedCheckoutProps) {
  const [error, setError] = useState<string | null>(preloadError ?? null);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    setError(null);
    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const data = (await response.json()) as { clientSecret?: string; error?: string };
    if (!response.ok || !data.clientSecret) {
      const msg = data.error ?? "Paiement indisponible";
      setError(msg);
      throw new Error(msg);
    }
    return data.clientSecret;
  }, [slug]);

  useEffect(() => {
    setError(preloadError ?? null);
  }, [preloadError, slug]);

  const providerOptions = preloadedClientSecret
    ? { clientSecret: preloadedClientSecret }
    : { fetchClientSecret };

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
      {!error && (preloadedClientSecret || slug) ? (
        <EmbeddedCheckoutProvider stripe={stripePromise} options={providerOptions}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      ) : null}
      <p className="text-center text-[11px] text-muted-foreground/50">Powered by Stripe</p>
    </div>
  );
}
