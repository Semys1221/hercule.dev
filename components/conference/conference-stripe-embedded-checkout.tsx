"use client";

import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import type { Stripe } from "@stripe/stripe-js";

type ConferenceStripeEmbeddedCheckoutProps = {
  stripePromise: Promise<Stripe | null>;
  fetchClientSecret: () => Promise<string>;
};

export function ConferenceStripeEmbeddedCheckout({
  stripePromise,
  fetchClientSecret,
}: ConferenceStripeEmbeddedCheckoutProps) {
  return (
    <EmbeddedCheckoutProvider
      stripe={stripePromise}
      options={{ fetchClientSecret }}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
