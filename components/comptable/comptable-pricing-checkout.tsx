"use client";

import { useCallback, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";

import { ComptablePricingGrid } from "@/components/comptable/comptable-pricing-grid";
import type { OfferTypeComptable } from "@/lib/commercial/constants";
import { COMPTABLE_PRICING_CTA } from "@/lib/commercial/comptable-pricing";
import { cn } from "@/lib/utils";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

export type ComptablePricingCheckoutProps = {
  slug: string;
  variant?: "sales" | "dashboard";
  ctaLabel?: string;
  className?: string;
  disabled?: boolean;
};

export function ComptablePricingCheckout({
  slug,
  variant = "dashboard",
  ctaLabel = COMPTABLE_PRICING_CTA,
  className,
  disabled = false,
}: ComptablePricingCheckoutProps) {
  const [selectedOffer, setSelectedOffer] = useState<OfferTypeComptable | null>(null);
  const [checkoutStarted, setCheckoutStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    setError(null);
    const response = await fetch("/api/payments/checkout-comptable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, offerType: selectedOffer }),
    });
    const data = (await response.json()) as { clientSecret?: string; error?: string };
    if (!response.ok || !data.clientSecret) {
      const msg = data.error ?? "Paiement indisponible";
      setError(msg);
      throw new Error(msg);
    }
    return data.clientSecret;
  }, [slug, selectedOffer]);

  if (checkoutStarted && selectedOffer) {
    return (
      <div className={cn("space-y-3", className)}>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!error ? (
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ fetchClientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        ) : null}
        <p className="text-center text-[11px] text-muted-foreground/50">
          Powered by Stripe
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {variant === "dashboard" ? (
        <p className="text-sm text-muted-foreground">
          Sélectionnez votre formule pour finaliser votre accès Hercule Comptable.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Choisissez la formule à activer pour ce cabinet. Le paiement s&apos;ouvre ci-dessous.
        </p>
      )}

      <div
        className={cn(
          variant === "sales" && "rounded-xl border border-border bg-black p-4 md:p-6",
        )}
      >
        <ComptablePricingGrid
          variant={disabled ? "marketing" : "checkout"}
          ctaLabel={ctaLabel}
          onSelectOffer={
            disabled
              ? undefined
              : (offerType) => {
                  setSelectedOffer(offerType);
                  setCheckoutStarted(true);
                }
          }
        />
      </div>

      {disabled ? (
        <p className="text-sm text-muted-foreground">
          Sélectionnez un lead CRM pour activer le checkout Stripe.
        </p>
      ) : null}
    </div>
  );
}
