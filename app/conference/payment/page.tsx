"use client";

import { useState } from "react";

import {
  ConferencePaymentCheckout,
} from "@/components/conference/conference-payment-checkout";
import {
  ConferencePricingCards,
  type ConferenceCheckoutSelection,
} from "@/components/conference/conference-pricing-cards";
import { HerculeLogo } from "@/components/conference/shared/HerculeLogo";
import { Button } from "@/components/ui/button";

export default function ConferencePaymentPage() {
  const [checkoutSelection, setCheckoutSelection] =
    useState<ConferenceCheckoutSelection | null>(null);

  return (
    <div className="flex min-h-screen w-full flex-col items-center gap-8 px-6 py-12">
      <HerculeLogo size="md" showName />

      <p className="text-center text-sm tracking-[0.18em] text-zinc-600">
        LES DÉCISIONS DE DEMAIN SE PRENNENT MAINTENANT.
      </p>

      {checkoutSelection ? (
        <div className="w-full max-w-3xl space-y-4">
          <ConferencePaymentCheckout selection={checkoutSelection} />
          <Button
            type="button"
            variant="ghost"
            className="text-zinc-500 hover:text-zinc-300"
            onClick={() => setCheckoutSelection(null)}
          >
            Choisir une autre formule
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-3xl">
          <ConferencePricingCards
            variant="checkout"
            onCheckout={setCheckoutSelection}
          />
        </div>
      )}
    </div>
  );
}
