"use client";

import { useState } from "react";

import { ConferencePaymentCheckout } from "@/components/conference/conference-payment-checkout";
import {
  ConferencePricingCards,
  type ConferenceCheckoutSelection,
} from "@/components/conference/conference-pricing-cards";
import { ConferenceSaleTimer } from "@/components/conference/conference-sale-timer";
import { HerculeLogo } from "@/components/conference/shared/HerculeLogo";
import { useConferenceSaleWindow } from "@/components/conference/use-conference-sale-window";
import { useFakeConferenceSeats } from "@/components/conference/use-fake-conference-seats";
import { Button } from "@/components/ui/button";

export default function ConferencePaymentPage() {
  const saleWindow = useConferenceSaleWindow({ poll: true });
  const seats = useFakeConferenceSeats(saleWindow.startedAt);
  const [checkoutSelection, setCheckoutSelection] =
    useState<ConferenceCheckoutSelection | null>(null);

  const linkOn = saleWindow.checkoutOpen;
  const showEmbeddedCheckout = linkOn && Boolean(checkoutSelection);

  return (
    <div className="flex min-h-screen w-full flex-col items-center gap-8 px-6 py-12">
      <HerculeLogo size="md" showName />

      <p className="text-center text-sm tracking-[0.18em] text-muted-foreground">
        Les décisions qui façonne l&apos;avenir sont prise aujourd&apos;hui
      </p>

      {saleWindow.phase !== "closed" ? (
        <ConferenceSaleTimer running={saleWindow.phase === "open"} />
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        {saleWindow.inactiveMessage}
      </p>

      {showEmbeddedCheckout ? (
        <div className="flex w-full max-w-3xl flex-col gap-4">
          <ConferencePaymentCheckout selection={checkoutSelection} />
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setCheckoutSelection(null)}
          >
            Choisir une autre formule
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-3xl">
          <ConferencePricingCards
            variant="checkout"
            checkoutOpen={linkOn}
            checkoutDisabledReason={saleWindow.inactiveMessage}
            decTaken={seats.decTaken}
            courtageTaken={seats.courtageTaken}
            onCheckout={setCheckoutSelection}
          />
        </div>
      )}
    </div>
  );
}
