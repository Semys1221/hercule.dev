"use client";

import { useCallback, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OFFER_TYPES_COMPTABLE, type OfferTypeComptable } from "@/lib/commercial/constants";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

type OfferOption = {
  offerType: OfferTypeComptable;
  label: string;
  price: string;
  description: string;
  featured?: boolean;
};

const OFFER_OPTIONS: OfferOption[] = [
  {
    offerType: OFFER_TYPES_COMPTABLE.starter999_5,
    label: "Hercule Starter",
    price: "999 € TTC",
    description: "5 missions PME · 1er RDV sous 15 j · 0 % commission · pas de garantie MRR",
  },
  {
    offerType: OFFER_TYPES_COMPTABLE.monthly1499,
    label: "Formule Croissance",
    price: "1 499 €/mois",
    description: "10 missions PME/mois · garantie 3 000 € MRR · recommandé cabinets",
    featured: true,
  },
  {
    offerType: OFFER_TYPES_COMPTABLE.pack3x1499,
    label: "Pack 3 mois Croissance",
    price: "3 598 € TTC",
    description: "10 missions/mois × 3 · −20 % · garantie 9 000 € MRR pack",
  },
];

type StepEmbeddedCheckoutComptableProps = {
  slug: string;
};

export function StepEmbeddedCheckoutComptable({
  slug,
}: StepEmbeddedCheckoutComptableProps) {
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Sélectionnez votre formule pour finaliser votre accès Hercule Comptable.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {OFFER_OPTIONS.map((offer) => (
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
