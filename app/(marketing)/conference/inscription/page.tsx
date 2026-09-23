"use client";

import { useState } from "react";

import {
  ConferencePricingCards,
  type ConferenceCheckoutSelection,
} from "@/components/conference/conference-pricing-cards";
import { ConferenceSaleTimer } from "@/components/conference/conference-sale-timer";
import { ConferenceStageAmbient } from "@/components/conference/shared/ConferenceStageAmbient";
import { FilmGrain } from "@/components/conference/shared/FilmGrain";
import { HerculeLogo } from "@/components/conference/shared/HerculeLogo";
import { useConferenceSaleWindow } from "@/components/conference/use-conference-sale-window";
import { useFakeConferenceSeats } from "@/components/conference/use-fake-conference-seats";
import { startConferencePaymentLinkCheckout } from "@/lib/legacy/payments/conference-payment-link-checkout";

const REDIRECTING_MESSAGE = "Redirection vers le paiement sécurisé…";

export default function ConferencePaymentPage() {
  const saleWindow = useConferenceSaleWindow({ poll: true });
  const seats = useFakeConferenceSeats(saleWindow.startedAt);
  const [redirecting, setRedirecting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const linkOn = saleWindow.checkoutOpen;

  async function handleCheckout(selection: ConferenceCheckoutSelection) {
    setRedirecting(true);
    setCheckoutError(null);
    try {
      const data = await startConferencePaymentLinkCheckout(selection);
      window.location.assign(data.url);
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "Paiement indisponible",
      );
      setRedirecting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center overflow-hidden px-6 py-12">
      <ConferenceStageAmbient />
      <FilmGrain />
      <div className="relative z-[2] flex w-full flex-col items-center gap-8">
        <HerculeLogo size="lg" showName />

        <p className="text-center text-sm tracking-[0.18em] text-muted-foreground">
          Les décisions qui façonnent l&apos;avenir sont prises aujourd&apos;hui
        </p>

        {saleWindow.phase !== "closed" ? (
          <ConferenceSaleTimer running={saleWindow.phase === "open"} />
        ) : null}

        <p className="text-center text-sm text-muted-foreground">
          {saleWindow.inactiveMessage}
        </p>

        {checkoutError ? (
          <p className="text-center text-sm text-destructive">{checkoutError}</p>
        ) : null}

        <div className="w-full max-w-3xl">
          <ConferencePricingCards
            variant="checkout"
            checkoutOpen={linkOn && !redirecting}
            checkoutDisabledReason={
              redirecting ? REDIRECTING_MESSAGE : saleWindow.inactiveMessage
            }
            decTaken={seats.decTaken}
            courtageTaken={seats.courtageTaken}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    </div>
  );
}
