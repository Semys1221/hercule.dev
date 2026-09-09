"use client";

import { useCallback, useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { PAYMENT_PHASES, type AgenceCheckoutOfferType } from "@/lib/commercial/constants";
import { amountCentsForAgenceOffer } from "@/lib/payments/agence-offers";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

function formatEuros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type StepEmbeddedCheckoutProps = {
  slug: string;
  offerType: AgenceCheckoutOfferType;
  clientSecret?: string | null;
  preloadError?: string | null;
};

export function StepEmbeddedCheckout({
  slug,
  offerType,
  clientSecret: preloadedClientSecret,
  preloadError,
}: StepEmbeddedCheckoutProps) {
  const [error, setError] = useState<string | null>(preloadError ?? null);
  const depositCents = amountCentsForAgenceOffer(offerType, PAYMENT_PHASES.deposit);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    setError(null);
    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, offerType }),
    });
    const data = (await response.json()) as { clientSecret?: string; error?: string };
    if (!response.ok || !data.clientSecret) {
      const msg = data.error ?? "Paiement indisponible";
      setError(msg);
      throw new Error(msg);
    }
    return data.clientSecret;
  }, [slug, offerType]);

  useEffect(() => {
    setError(preloadError ?? null);
  }, [preloadError, slug, offerType]);

  const providerOptions = preloadedClientSecret
    ? { clientSecret: preloadedClientSecret }
    : { fetchClientSecret };

  return (
    <div className="space-y-3">
      <Alert>
        <AlertDescription>
          Acompte 50 % — {formatEuros(depositCents)} maintenant. Solde dû à la livraison
          de vos contrats PME sécurisés.
        </AlertDescription>
      </Alert>
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
