"use client";

import { useEffect, useState } from "react";

import { ConferencePaymentCheckout } from "@/components/conference/conference-payment-checkout";
import {
  ConferencePricingCards,
  type ConferenceCheckoutSelection,
} from "@/components/conference/conference-pricing-cards";
import { HerculeLogo } from "@/components/conference/shared/HerculeLogo";
import { useConferenceSaleWindow } from "@/components/conference/use-conference-sale-window";
import { useFakeConferenceSeats } from "@/components/conference/use-fake-conference-seats";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ClientDashboardData } from "@/lib/clients/types";
import { conferenceOfferLabel } from "@/lib/commercial/conference-pricing";

type ClientRenewalPageProps = {
  slug: string;
};

export function ClientRenewalPage({ slug }: ClientRenewalPageProps) {
  const saleWindow = useConferenceSaleWindow();
  const seats = useFakeConferenceSeats(saleWindow.startedAt);
  const [checkoutSelection, setCheckoutSelection] =
    useState<ConferenceCheckoutSelection | null>(null);
  const [offerLabel, setOfferLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadOffer() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/clients/${encodeURIComponent(slug)}`);
        const body = (await response.json()) as ClientDashboardData & { error?: string };
        if (!response.ok) {
          throw new Error(body.error || "Dossier introuvable");
        }
        if (!cancelled) {
          setOfferLabel(conferenceOfferLabel(body.offerType));
        }
      } catch (err) {
        if (!cancelled) {
          setOfferLabel(null);
          setError(err instanceof Error ? err.message : "Dossier introuvable");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOffer();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const linkOn = saleWindow.checkoutOpen;
  const showEmbeddedCheckout = linkOn && Boolean(checkoutSelection) && !error;

  return (
    <div className="flex min-h-screen w-full flex-col items-center gap-8 px-6 py-12">
      <HerculeLogo size="md" showName />

      <p className="text-center text-sm tracking-[0.18em] text-zinc-600">
        LES DÉCISIONS DE DEMAIN SE PRENNENT MAINTENANT.
      </p>

      {loading ? (
        <Spinner className="size-6" />
      ) : error ? (
        <Alert variant="destructive" className="max-w-3xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="flex w-full max-w-3xl flex-col items-center gap-2 text-center">
          <p className="text-base text-foreground">
            Votre offre actuelle : {offerLabel}
          </p>
          <p className="text-sm text-zinc-400">
            Souhaitez-vous passer à une autre formule ?
          </p>
        </div>
      )}

      {!linkOn && !error && !loading ? (
        <p className="text-center text-sm text-zinc-500">Le lien n&apos;est pas actif.</p>
      ) : null}

      {error || loading ? null : showEmbeddedCheckout ? (
        <div className="flex w-full max-w-3xl flex-col gap-4">
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
      ) : error || loading ? null : (
        <div className="w-full max-w-3xl">
          <ConferencePricingCards
            variant="checkout"
            checkoutOpen={linkOn}
            checkoutDisabledReason="Le lien n'est pas actif."
            decTaken={seats.decTaken}
            courtageTaken={seats.courtageTaken}
            onCheckout={setCheckoutSelection}
          />
        </div>
      )}
    </div>
  );
}
