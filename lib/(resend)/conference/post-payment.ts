import type {
  ConferenceClientType,
  ConferenceOfferType,
} from "@/lib/commercial/conference-pricing";
import { buildClientDashboardUrl } from "@/lib/clients/supabase";
import {
  isPaymentOnboardingSequenceEnabled,
  startPaymentOnboardingSequence,
} from "@/lib/(resend)/onboarding";
import { sendBookingEmail } from "@/lib/(resend)/communication/send";

export async function scheduleConferenceEmailSequence(params: {
  clientType: ConferenceClientType;
  slug: string;
  offerType: ConferenceOfferType;
  secondaryVertical?: "ias";
  clientId: string;
  recipientEmail: string;
  paymentAt: Date;
  stripeCheckoutSessionId: string;
}): Promise<void> {
  void params.offerType;
  void params.secondaryVertical;

  const recipientEmail = params.recipientEmail.trim();
  if (!recipientEmail) {
    return;
  }

  const dashboardLink = buildClientDashboardUrl(params.slug);

  if (isPaymentOnboardingSequenceEnabled()) {
    try {
      await startPaymentOnboardingSequence({
        vertical: params.clientType,
        recipientEmail,
        leadId: params.clientId,
        leadCategory: "client",
        paymentAt: params.paymentAt,
        stripeCheckoutSessionId: params.stripeCheckoutSessionId,
        dashboardLink,
      });
      return;
    } catch (error) {
      console.error(
        "[conference/post-payment] payment-onboarding sequence failed, falling back:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  await sendBookingEmail({
    to: recipientEmail,
    subject: "Bienvenue chez Hercule — votre espace client est prêt",
    text: [
      "Bonjour,",
      "",
      "Votre paiement est confirmé. Vous recevrez une invitation Calendly pour connecter votre agenda.",
      "",
      `Suivez votre livraison ici : ${dashboardLink}`,
      "",
      "L'équipe Hercule",
    ].join("\n"),
    idempotencyKey: `conference:welcome:${params.clientId}:${params.stripeCheckoutSessionId}`,
  });
}
