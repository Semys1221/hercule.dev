import type {
  ConferenceClientType,
  ConferenceOfferType,
} from "@/lib/commercial/conference-pricing";
import { isClientResendAutoEmailsEnabled } from "@/lib/clients/resend-auto-emails";
import { buildClientDashboardUrl, createClientsClient, findClientById } from "@/lib/clients/supabase";
import {
  isPaymentOnboardingSequenceEnabled,
  startPaymentOnboardingSequence,
} from "@/lib/(resend)/onboarding";
import { sendBookingEmail } from "@/lib/(resend)/communication/send";
import { renderNotification } from "@/lib/(resend)/notifications/file-io";

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

  const db = createClientsClient();
  const clientRow = await findClientById(db, params.clientId);
  if (clientRow && !isClientResendAutoEmailsEnabled(clientRow.profile)) {
    return;
  }

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

  const welcome = renderNotification("conference-welcome-fallback", {
    dashboardLink,
  });
  await sendBookingEmail({
    to: recipientEmail,
    subject: welcome.subject,
    text: welcome.text,
    idempotencyKey: `conference:welcome:${params.clientId}:${params.stripeCheckoutSessionId}`,
  });
}
