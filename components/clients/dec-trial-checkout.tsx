"use client";

import { useCallback, useState } from "react";

import { CabinetEmbeddedCheckoutSession } from "@/components/legacy/dashboard/steps/cabinet-embedded-checkout-session";
import { useStripePromise } from "@/lib/legacy/payments/use-stripe-promise";
import { cn } from "@/lib/utils";

export function DecTrialCheckout({ className }: { className?: string }) {
  const { stripePromise, error: stripeConfigError, loading: stripeLoading } =
    useStripePromise();
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    setError(null);
    const response = await fetch("/api/payments/checkout-dec-trial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = (await response.json()) as {
      clientSecret?: string;
      error?: string;
    };
    if (!response.ok || !data.clientSecret) {
      const msg = data.error ?? "Paiement indisponible";
      setError(msg);
      throw new Error(msg);
    }
    setClientSecret(data.clientSecret);
    return data.clientSecret;
  }, []);

  const providerOptions = clientSecret
    ? { clientSecret }
    : { fetchClientSecret };

  return (
    <div className={cn("dec-trial-checkout w-full bg-background", className)}>
      <CabinetEmbeddedCheckoutSession
        stripePromise={stripePromise}
        stripeLoading={stripeLoading}
        stripeConfigError={stripeConfigError}
        error={error}
        canRenderCheckout={Boolean(stripePromise)}
        providerOptions={providerOptions}
        showPoweredBy={false}
        className="space-y-3 bg-background"
      />
    </div>
  );
}
