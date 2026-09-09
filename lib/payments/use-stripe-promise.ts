"use client";

import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";

type StripePromiseState = {
  stripePromise: Promise<Stripe | null> | null;
  error: string | null;
  loading: boolean;
};

export function useStripePromise(): StripePromiseState {
  const [state, setState] = useState<StripePromiseState>({
    stripePromise: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/payments/stripe-config");
        const body = (await response.json()) as { publishableKey?: string; error?: string };

        if (!response.ok || !body.publishableKey) {
          throw new Error(body.error ?? "Configuration Stripe indisponible");
        }

        if (cancelled) {
          return;
        }

        setState({
          stripePromise: loadStripe(body.publishableKey),
          error: null,
          loading: false,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        setState({
          stripePromise: null,
          error: error instanceof Error ? error.message : "Configuration Stripe indisponible",
          loading: false,
        });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
