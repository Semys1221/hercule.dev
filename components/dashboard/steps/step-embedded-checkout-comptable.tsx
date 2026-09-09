"use client";

import { useCallback, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  OFFER_TYPES_COMPTABLE,
  type OfferTypeComptable,
} from "@/lib/commercial/constants";
import { COMPTABLE_OFFER_LABELS } from "@/lib/commercial/comptable-pricing";
import { getPricingDocument } from "@/lib/site/pricing-data";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

const OFFER_ORDER: OfferTypeComptable[] = [
  OFFER_TYPES_COMPTABLE.starter999_5,
  OFFER_TYPES_COMPTABLE.monthly1499,
  OFFER_TYPES_COMPTABLE.pack3x1499,
];

type StepEmbeddedCheckoutComptableProps = {
  slug: string;
  selectedOffer?: OfferTypeComptable | null;
  startImmediately?: boolean;
};

export function StepEmbeddedCheckoutComptable({
  slug,
  selectedOffer: selectedOfferProp = null,
  startImmediately = false,
}: StepEmbeddedCheckoutComptableProps) {
  const [selectedOffer, setSelectedOffer] = useState<OfferTypeComptable | null>(
    selectedOfferProp,
  );
  const [checkoutStarted, setCheckoutStarted] = useState(
    startImmediately && Boolean(selectedOfferProp),
  );
  const [error, setError] = useState<string | null>(null);

  const activeOffer = selectedOfferProp ?? selectedOffer;

  const offerOptions = useMemo(() => {
    const document = getPricingDocument("comptable");
    if (!document) {
      return [];
    }
    const byOfferType = new Map<string, (typeof document.plans)[number]>();
    for (const plan of document.plans) {
      if (plan.offerType) {
        byOfferType.set(plan.offerType, plan);
      }
    }

    const options: Array<{
      offerType: OfferTypeComptable;
      label: string;
      price: string;
      description: string;
      featured?: boolean;
    }> = [];

    for (const offerType of OFFER_ORDER) {
      const plan = byOfferType.get(offerType);
      if (!plan) {
        continue;
      }
      options.push({
        offerType,
        label: COMPTABLE_OFFER_LABELS[offerType],
        price: [plan.price, plan.priceSuffix].filter(Boolean).join(" "),
        description: plan.summary,
        featured: plan.featured,
      });
    }

    return options;
  }, []);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    setError(null);
    if (!activeOffer) {
      throw new Error("Formule non sélectionnée");
    }

    const response = await fetch("/api/payments/checkout-comptable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, offerType: activeOffer }),
    });
    const data = (await response.json()) as { clientSecret?: string; error?: string };
    if (!response.ok || !data.clientSecret) {
      const msg = data.error ?? "Paiement indisponible";
      setError(msg);
      throw new Error(msg);
    }
    return data.clientSecret;
  }, [slug, activeOffer]);

  if (checkoutStarted && activeOffer) {
    return (
      <div className="space-y-3">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}
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

  if (offerOptions.length === 0) {
    return (
      <p className="text-sm text-destructive">
        Offre indisponible — configuration tarifaire manquante.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Sélectionnez votre formule pour finaliser votre accès Hercule Comptable.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {offerOptions.map((offer) => (
          <Card
            key={offer.offerType}
            className={`cursor-pointer transition-colors ${
              selectedOffer === offer.offerType
                ? "border-foreground"
                : "hover:border-muted-foreground/50"
            }`}
            onClick={() => setSelectedOffer(offer.offerType)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {offer.label}
                {offer.featured ? (
                  <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                    Recommandé
                  </span>
                ) : null}
              </CardTitle>
              <p className="text-lg font-semibold">{offer.price}</p>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{offer.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button
        className="w-full"
        disabled={!selectedOffer}
        onClick={() => {
          if (selectedOffer) setCheckoutStarted(true);
        }}
      >
        Finaliser le paiement
      </Button>
    </div>
  );
}
