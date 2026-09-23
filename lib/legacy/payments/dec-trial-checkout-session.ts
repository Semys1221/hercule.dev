import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import {
  FREE_TRIAL_PERIOD_DAYS,
  FREE_TRIAL_STRIPE_PRODUCT,
  OFFER_TYPES_COMPTABLE,
} from "@/lib/commercial/constants";
import {
  DEC_TRIAL_CHECKOUT_PRODUCT_DESCRIPTION,
  DEC_TRIAL_CHECKOUT_PRODUCT_NAME,
  DEC_FREE_TRIAL_SOURCE,
  isDecFreeTrialCheckoutMetadata,
} from "@/lib/clients/dec-free-trial";
import { createDecTrialClientDraft } from "@/lib/legacy/payments/dec-trial-client-draft";
import {
  getAppBaseUrl,
  getConferenceCheckoutBrandingSettings,
  getComptableMonthlyTrialPriceId,
  getStripeClient,
} from "@/lib/legacy/payments/stripe";
import { handleDecFreeTrialCheckoutCompleted } from "@/lib/legacy/payments/stripe-webhook-dec-trial";

export type CreateDecTrialCheckoutResult = {
  clientSecret: string;
  sessionId: string;
  slug: string;
};

export async function createDecTrialEmbeddedCheckout(
  client: SupabaseClient,
): Promise<CreateDecTrialCheckoutResult> {
  const draft = await createDecTrialClientDraft(client);
  const stripe = getStripeClient();
  const priceId = getComptableMonthlyTrialPriceId();
  const trialPrice = await stripe.prices.retrieve(priceId);
  if (!trialPrice.unit_amount || !trialPrice.recurring) {
    throw new Error("Invalid Stripe DEC trial price configuration");
  }
  const baseUrl = getAppBaseUrl();

  const metadata = {
    source: DEC_FREE_TRIAL_SOURCE,
    product: FREE_TRIAL_STRIPE_PRODUCT,
    offer_type: OFFER_TYPES_COMPTABLE.monthly1499Trial,
    client_id: draft.clientId,
    payment_id: draft.paymentId,
    slug: draft.slug,
  };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    locale: "fr",
    ui_mode: "embedded_page" as const,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: trialPrice.currency,
          unit_amount: trialPrice.unit_amount,
          recurring: {
            interval: trialPrice.recurring.interval,
            interval_count: trialPrice.recurring.interval_count ?? 1,
          },
          product_data: {
            name: DEC_TRIAL_CHECKOUT_PRODUCT_NAME,
            description: DEC_TRIAL_CHECKOUT_PRODUCT_DESCRIPTION,
          },
        },
      },
    ],
    return_url: `${baseUrl}/clients/${draft.slug}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
    branding_settings: getConferenceCheckoutBrandingSettings(),
    custom_text: {
      submit: {
        message:
          "Carte enregistrée pour l'essai — aucun prélèvement avant la fin des 14 jours si vous annulez à temps.",
      },
    },
    wallet_options: {
      link: { display: "never" },
    },
    metadata,
    subscription_data: {
      trial_period_days: FREE_TRIAL_PERIOD_DAYS,
      metadata,
    },
  });

  if (!session.client_secret) {
    throw new Error("Stripe checkout session missing client_secret");
  }

  const { error: paymentUpdateError } = await client
    .from("payments")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", draft.paymentId);

  if (paymentUpdateError) {
    throw new Error(paymentUpdateError.message);
  }

  return {
    clientSecret: session.client_secret,
    sessionId: session.id,
    slug: draft.slug,
  };
}

async function findPaymentBySession(
  client: SupabaseClient,
  sessionId: string,
): Promise<{ id: string; client_id: string } | null> {
  const { data } = await client
    .from("payments")
    .select("id, client_id")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  return data?.client_id ? data : null;
}

export async function resolveDecTrialCheckoutSession(
  client: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<Stripe.Checkout.Session | null> {
  if (isDecFreeTrialCheckoutMetadata(session.metadata)) {
    return session;
  }

  const payment = await findPaymentBySession(client, session.id);
  if (!payment) {
    return null;
  }

  const offerType = session.metadata?.offer_type;
  if (offerType !== OFFER_TYPES_COMPTABLE.monthly1499Trial) {
    const { data: paymentRow } = await client
      .from("payments")
      .select("offer_type")
      .eq("id", payment.id)
      .maybeSingle();
    if (paymentRow?.offer_type !== OFFER_TYPES_COMPTABLE.monthly1499Trial) {
      return null;
    }
  }

  return {
    ...session,
    metadata: {
      ...session.metadata,
      source: DEC_FREE_TRIAL_SOURCE,
      product: FREE_TRIAL_STRIPE_PRODUCT,
      offer_type: OFFER_TYPES_COMPTABLE.monthly1499Trial,
      client_id: payment.client_id,
      payment_id: payment.id,
    },
  };
}

function checkoutSessionIsComplete(session: Stripe.Checkout.Session): boolean {
  if (session.status !== "complete") {
    return false;
  }
  return (
    session.payment_status === "paid" || session.payment_status === "no_payment_required"
  );
}

export type SyncDecTrialCheckoutResult = {
  synced: boolean;
  reason?: "not_paid_yet" | "not_dec_trial_checkout" | "session_not_found";
};

export async function syncDecTrialCheckoutSession(
  sessionId: string,
): Promise<SyncDecTrialCheckoutResult> {
  const stripe = getStripeClient();
  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return { synced: false, reason: "session_not_found" };
  }

  if (!checkoutSessionIsComplete(session)) {
    return { synced: false, reason: "not_paid_yet" };
  }

  const client = createLinkTrackingClient();
  const decSession = await resolveDecTrialCheckoutSession(client, session);
  if (!decSession) {
    return { synced: false, reason: "not_dec_trial_checkout" };
  }

  const synced = await handleDecFreeTrialCheckoutCompleted(
    client,
    decSession,
    `sync:${session.id}`,
  );

  return { synced };
}
