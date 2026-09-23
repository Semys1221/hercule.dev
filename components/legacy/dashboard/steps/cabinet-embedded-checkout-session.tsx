"use client";

import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import type { Stripe } from "@stripe/stripe-js";

import { Spinner } from "@/components/ui/spinner";

type CabinetEmbeddedCheckoutSessionProps = {
  stripePromise: Promise<Stripe | null> | null;
  stripeLoading: boolean;
  stripeConfigError: string | null;
  error: string | null;
  canRenderCheckout: boolean;
  providerOptions:
    | { clientSecret: string }
    | { fetchClientSecret: () => Promise<string> };
  showPoweredBy?: boolean;
  className?: string;
};

export function CabinetEmbeddedCheckoutSession({
  stripePromise,
  stripeLoading,
  stripeConfigError,
  error,
  canRenderCheckout,
  providerOptions,
  showPoweredBy = true,
  className,
}: CabinetEmbeddedCheckoutSessionProps) {
  const displayError = error ?? stripeConfigError;

  return (
    <div className={className ?? "space-y-3"}>
      {displayError ? (
        <p className="text-sm text-destructive">{displayError}</p>
      ) : null}
      {stripeLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-6" />
        </div>
      ) : null}
      {!displayError && stripePromise && canRenderCheckout ? (
        <EmbeddedCheckoutProvider stripe={stripePromise} options={providerOptions}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      ) : null}
      {showPoweredBy ? (
        <p className="text-center text-[11px] text-muted-foreground/50">
          Powered by Stripe
        </p>
      ) : null}
    </div>
  );
}
