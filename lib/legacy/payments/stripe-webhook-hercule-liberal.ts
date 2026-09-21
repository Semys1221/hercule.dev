import type Stripe from "stripe";

import { HERCULE_LIBERAL_PRODUCT_NAME } from "@/lib/legacy/payments/hercule-liberal-offers";
import { getBookingFromAddress } from "@/lib/legacy/booking-communication/templates";
import { getResendClient } from "@/lib/resend";

export function isHerculeLiberalCheckoutSession(
  session: Stripe.Checkout.Session,
): boolean {
  return session.metadata?.product === "hercule_liberal";
}

export async function handleHerculeLiberalCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const opsEmail = process.env.NOTIFICATION_OPS_EMAIL?.trim();
  if (!opsEmail) {
    return;
  }

  const customerEmail =
    session.customer_details?.email?.trim() ||
    session.customer_email?.trim() ||
    "—";
  const amountTotal = session.amount_total ?? 0;
  const amountLabel =
    amountTotal > 0
      ? `${(amountTotal / 100).toLocaleString("fr-FR")} €`
      : "1 200 €/mois (abonnement)";

  try {
    await getResendClient().emails.send({
      from: getBookingFromAddress(),
      to: [opsEmail],
      subject: `Nouvel abonnement ${HERCULE_LIBERAL_PRODUCT_NAME} — ${customerEmail}`,
      text: [
        `Abonnement ${HERCULE_LIBERAL_PRODUCT_NAME} confirmé.`,
        `Client : ${customerEmail}`,
        `Montant session : ${amountLabel}`,
        `Checkout session : ${session.id}`,
        session.subscription
          ? `Subscription : ${String(session.subscription)}`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  } catch (error) {
    console.error(
      "[stripe/webhook] hercule liberal ops notification failed:",
      error instanceof Error ? error.message : error,
    );
  }
}
