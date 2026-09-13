"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { OfferTypeComptable } from "@/lib/commercial/constants";
import type { DashboardFaqAudience } from "@/lib/dashboard/types";
import {
  buildCabinetCheckoutOfferOptions,
  requestCabinetCheckoutClientSecret,
  type CabinetCheckoutAudience,
} from "@/lib/payments/cabinet-checkout";
import { useStripePromise } from "@/lib/payments/use-stripe-promise";

import { CabinetCheckoutOfferPicker } from "./cabinet-checkout-offer-picker";
import { CabinetEmbeddedCheckoutSession } from "./cabinet-embedded-checkout-session";

type StepEmbeddedCheckoutComptableProps = {
  slug: string;
  audience?: Extract<DashboardFaqAudience, "comptable" | "cif">;
  selectedOffer?: OfferTypeComptable | null;
  startImmediately?: boolean;
  clientSecret?: string | null;
  preloadError?: string | null;
};

export function StepEmbeddedCheckoutComptable({
  slug,
  audience = "comptable",
  selectedOffer: selectedOfferProp = null,
  startImmediately = false,
  clientSecret: preloadedClientSecret,
  preloadError,
}: StepEmbeddedCheckoutComptableProps) {
  const { stripePromise, error: stripeConfigError, loading: stripeLoading } =
    useStripePromise();
  const [selectedOffer, setSelectedOffer] = useState<OfferTypeComptable | null>(
    selectedOfferProp,
  );
  const [checkoutStarted, setCheckoutStarted] = useState(
    startImmediately && Boolean(selectedOfferProp),
  );
  const [error, setError] = useState<string | null>(preloadError ?? null);

  const activeOffer = selectedOfferProp ?? selectedOffer;
  const offerOptions = useMemo(
    () => buildCabinetCheckoutOfferOptions(audience as CabinetCheckoutAudience),
    [audience],
  );

  useEffect(() => {
    setError(preloadError ?? null);
  }, [preloadError, slug, activeOffer]);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    setError(null);
    if (!activeOffer) {
      throw new Error("Formule non sélectionnée");
    }

    try {
      return await requestCabinetCheckoutClientSecret(audience, slug, activeOffer);
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error ? checkoutError.message : "Paiement indisponible";
      setError(message);
      throw checkoutError instanceof Error ? checkoutError : new Error(message);
    }
  }, [audience, slug, activeOffer]);

  const providerOptions = preloadedClientSecret
    ? { clientSecret: preloadedClientSecret }
    : { fetchClientSecret };

  if (checkoutStarted && activeOffer) {
    return (
      <CabinetEmbeddedCheckoutSession
        stripePromise={stripePromise}
        stripeLoading={stripeLoading}
        stripeConfigError={stripeConfigError}
        error={error}
        canRenderCheckout={Boolean(preloadedClientSecret || slug)}
        providerOptions={providerOptions}
      />
    );
  }

  return (
    <CabinetCheckoutOfferPicker
      audience={audience}
      offers={offerOptions}
      selectedOffer={selectedOffer}
      onSelectOffer={setSelectedOffer}
      onContinue={() => {
        if (selectedOffer) {
          setCheckoutStarted(true);
        }
      }}
    />
  );
}
