"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  formatAgenceFastFirstRdvLabel,
  formatAgenceStandardFirstRdvLabel,
  PAYMENT_PHASES,
  totalPriceCentsForOffer,
  type AgenceCheckoutOfferType,
} from "@/lib/commercial/constants";
import { amountCentsForAgenceOffer } from "@/lib/payments/agence-offers";
import { useStripePromise } from "@/lib/payments/use-stripe-promise";

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
  fast?: boolean;
  clientSecret?: string | null;
  preloadError?: string | null;
};

export function StepEmbeddedCheckout({
  slug,
  offerType,
  fast = false,
  clientSecret: preloadedClientSecret,
  preloadError,
}: StepEmbeddedCheckoutProps) {
  const { stripePromise, error: stripeConfigError, loading: stripeLoading } =
    useStripePromise();
  const [error, setError] = useState<string | null>(preloadError ?? null);
  const depositCents = amountCentsForAgenceOffer(offerType, PAYMENT_PHASES.deposit);
  const fullCents = totalPriceCentsForOffer(offerType);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    setError(null);
    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, offerType, fast }),
    });
    const data = (await response.json()) as { clientSecret?: string; error?: string };
    if (!response.ok || !data.clientSecret) {
      const msg = data.error ?? "Paiement indisponible";
      setError(msg);
      throw new Error(msg);
    }
    return data.clientSecret;
  }, [slug, offerType, fast]);

  useEffect(() => {
    setError(preloadError ?? null);
  }, [preloadError, slug, offerType, fast]);

  const providerOptions = preloadedClientSecret
    ? { clientSecret: preloadedClientSecret }
    : { fetchClientSecret };

  return (
    <div className="space-y-3">
      <Alert>
        <AlertDescription>
          {fast
            ? `Fast — paiement intégral ${formatEuros(fullCents)} · premier RDV sous ${formatAgenceFastFirstRdvLabel()}.`
            : `Acompte 50 % — ${formatEuros(depositCents)} maintenant. Solde dû à la livraison de vos contrats PME sécurisés · premier RDV sous ${formatAgenceStandardFirstRdvLabel()}.`}
        </AlertDescription>
      </Alert>
      {error || stripeConfigError ? (
        <p className="text-sm text-destructive">{error ?? stripeConfigError}</p>
      ) : null}
      {stripeLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-6" />
        </div>
      ) : null}
      {!error && !stripeConfigError && stripePromise && (preloadedClientSecret || slug) ? (
        <EmbeddedCheckoutProvider stripe={stripePromise} options={providerOptions}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      ) : null}
      <p className="text-center text-[11px] text-muted-foreground/50">Powered by Stripe</p>
    </div>
  );
}
