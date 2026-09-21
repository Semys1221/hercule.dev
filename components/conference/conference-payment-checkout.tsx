"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import type { ConferenceCheckoutSelection } from "@/components/conference/conference-pricing-cards";
import { Spinner } from "@/components/ui/spinner";
import { useStripePromise } from "@/lib/legacy/payments/use-stripe-promise";
import { cn } from "@/lib/utils";

const StripeEmbeddedCheckout = dynamic(
  () =>
    import("@/components/conference/conference-stripe-embedded-checkout").then(
      (mod) => mod.ConferenceStripeEmbeddedCheckout,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-12">
        <Spinner className="size-6" />
      </div>
    ),
  },
);

export type ConferencePaymentCheckoutProps = {
  selection: ConferenceCheckoutSelection;
  className?: string;
  onError?: (message: string) => void;
};

export function ConferencePaymentCheckout({
  selection,
  className,
  onError,
}: ConferencePaymentCheckoutProps) {
  const { stripePromise, error: stripeConfigError, loading: stripeLoading } =
    useStripePromise();
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    setError(null);
    const response = await fetch("/api/payments/checkout-conference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card: selection.card,
        billing: selection.billing,
        selections: selection.selections,
      }),
    });
    const data = (await response.json()) as {
      clientSecret?: string;
      error?: string;
    };
    if (!response.ok || !data.clientSecret) {
      const msg = data.error ?? "Paiement indisponible";
      setError(msg);
      onError?.(msg);
      throw new Error(msg);
    }
    return data.clientSecret;
  }, [onError, selection.billing, selection.card, selection.selections]);

  const displayError = error ?? stripeConfigError;

  return (
    <div className={cn("space-y-3", className)}>
      {displayError ? (
        <p className="text-sm text-destructive">{displayError}</p>
      ) : null}
      {stripeLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-6" />
        </div>
      ) : null}
      {!displayError && stripePromise ? (
        <StripeEmbeddedCheckout
          stripePromise={stripePromise}
          fetchClientSecret={fetchClientSecret}
        />
      ) : null}
      <p className="text-center text-[11px] text-zinc-600">Powered by Stripe</p>
    </div>
  );
}
