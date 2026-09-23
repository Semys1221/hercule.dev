import type Stripe from "stripe";

import { getStripeClient } from "@/lib/legacy/payments/stripe";

type SubscriptionPeriod = Stripe.Subscription & {
  current_period_end?: number;
  items?: {
    data?: Array<{ current_period_end?: number }>;
  };
};

export function periodEndFromSubscription(subscription: Stripe.Subscription): Date | null {
  const row = subscription as SubscriptionPeriod;
  const legacy = row.current_period_end;
  if (typeof legacy === "number" && legacy > 0) {
    return new Date(legacy * 1000);
  }
  const itemEnd = row.items?.data?.[0]?.current_period_end;
  if (typeof itemEnd === "number" && itemEnd > 0) {
    return new Date(itemEnd * 1000);
  }
  return null;
}

export async function getSubscriptionPeriodEnd(
  stripeSubscriptionId: string,
): Promise<Date | null> {
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  return periodEndFromSubscription(subscription);
}

export async function pauseStripeSubscription(stripeSubscriptionId: string): Promise<void> {
  const stripe = getStripeClient();
  await stripe.subscriptions.update(stripeSubscriptionId, {
    pause_collection: { behavior: "void" },
  });
}
