import { sendBookingEmail } from "@/lib/(resend)/communication/send";
import { renderNotification } from "@/lib/(resend)/notifications/file-io";

import { HERCULE_OPS_EMAIL, isCheckoutPlaceholderEmail } from "@/lib/clients/ops";
import { buildClientDashboardUrl } from "@/lib/clients/supabase";
import type { ClientRow } from "@/lib/clients/types";

export async function notifySubscriptionRenewed(params: {
  client: ClientRow;
  rdvTotal: number;
  stripeEventId: string;
}): Promise<void> {
  const displayName = params.client.first_name?.trim() || params.client.email;
  const dashboardLink = buildClientDashboardUrl(params.client.slug);

  const opsEmail = renderNotification("subscription-renewed-ops", {
    displayName,
    email: params.client.email,
    slug: params.client.slug,
    balance: `0 / ${params.rdvTotal}`,
    dashboardLink,
  });
  const opsResult = await sendBookingEmail({
    to: HERCULE_OPS_EMAIL,
    subject: opsEmail.subject,
    text: opsEmail.text,
    idempotencyKey: `conference-renew-ops:${params.client.id}:${params.stripeEventId}`,
  });
  if (!opsResult.ok) {
    throw new Error(opsResult.error);
  }

  if (isCheckoutPlaceholderEmail(params.client.email)) {
    return;
  }

  const clientEmail = renderNotification("subscription-renewed-client", {
    greeting: params.client.first_name
      ? `Bonjour ${params.client.first_name},`
      : "Bonjour,",
    balance: `0 / ${params.rdvTotal}`,
    dashboardLink,
  });
  const clientResult = await sendBookingEmail({
    to: params.client.email,
    subject: clientEmail.subject,
    text: clientEmail.text,
    idempotencyKey: `conference-renew-client:${params.client.id}:${params.stripeEventId}`,
  });
  if (!clientResult.ok) {
    throw new Error(clientResult.error);
  }
}

export async function notifySubscriptionCancelled(params: {
  client: ClientRow;
  subscriptionId: string;
}): Promise<void> {
  const displayName = params.client.first_name?.trim() || params.client.email;
  const dashboardLink = buildClientDashboardUrl(params.client.slug);

  const opsEmail = renderNotification("subscription-cancelled-ops", {
    displayName,
    email: params.client.email,
    slug: params.client.slug,
    subscriptionId: params.subscriptionId,
    dashboardLink,
  });
  const opsResult = await sendBookingEmail({
    to: HERCULE_OPS_EMAIL,
    subject: opsEmail.subject,
    text: opsEmail.text,
    idempotencyKey: `conference-cancel-ops:${params.client.id}:${params.subscriptionId}`,
  });
  if (!opsResult.ok) {
    throw new Error(opsResult.error);
  }

  if (isCheckoutPlaceholderEmail(params.client.email)) {
    return;
  }

  const clientEmail = renderNotification("subscription-cancelled-client", {
    greeting: params.client.first_name
      ? `Bonjour ${params.client.first_name},`
      : "Bonjour,",
    dashboardLink,
  });
  const clientResult = await sendBookingEmail({
    to: params.client.email,
    subject: clientEmail.subject,
    text: clientEmail.text,
    idempotencyKey: `conference-cancel-client:${params.client.id}:${params.subscriptionId}`,
  });
  if (!clientResult.ok) {
    throw new Error(clientResult.error);
  }
}
