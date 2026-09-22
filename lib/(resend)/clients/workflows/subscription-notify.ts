import { sendBookingEmail } from "@/lib/(resend)/communication/send";

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

  const opsResult = await sendBookingEmail({
    to: HERCULE_OPS_EMAIL,
    subject: `[Abonnement] Renouvellement — ${displayName}`,
    text: [
      "Renouvellement d'abonnement conférence (invoice paid).",
      "",
      `Nom : ${displayName}`,
      `Email : ${params.client.email}`,
      `Slug : ${params.client.slug}`,
      `Crédits réinitialisés : 0 / ${params.rdvTotal}`,
      `Dashboard : ${dashboardLink}`,
    ].join("\n"),
    idempotencyKey: `conference-renew-ops:${params.client.id}:${params.stripeEventId}`,
  });
  if (!opsResult.ok) {
    throw new Error(opsResult.error);
  }

  if (isCheckoutPlaceholderEmail(params.client.email)) {
    return;
  }

  const clientResult = await sendBookingEmail({
    to: params.client.email,
    subject: "Vos crédits rendez-vous ont été renouvelés",
    text: [
      params.client.first_name
        ? `Bonjour ${params.client.first_name},`
        : "Bonjour,",
      "",
      "Votre abonnement a été renouvelé. Vos crédits rendez-vous ont été réinitialisés.",
      "",
      `Solde : 0 / ${params.rdvTotal}`,
      "",
      `Espace client : ${dashboardLink}`,
      "",
      "L'équipe Hercule",
    ].join("\n"),
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

  const opsResult = await sendBookingEmail({
    to: HERCULE_OPS_EMAIL,
    subject: `[Abonnement] Annulation — ${displayName}`,
    text: [
      "Abonnement conférence annulé (subscription deleted).",
      "",
      `Nom : ${displayName}`,
      `Email : ${params.client.email}`,
      `Slug : ${params.client.slug}`,
      `Subscription : ${params.subscriptionId}`,
      `Dashboard : ${dashboardLink}`,
    ].join("\n"),
    idempotencyKey: `conference-cancel-ops:${params.client.id}:${params.subscriptionId}`,
  });
  if (!opsResult.ok) {
    throw new Error(opsResult.error);
  }

  if (isCheckoutPlaceholderEmail(params.client.email)) {
    return;
  }

  const clientResult = await sendBookingEmail({
    to: params.client.email,
    subject: "Votre abonnement Hercule a été annulé",
    text: [
      params.client.first_name
        ? `Bonjour ${params.client.first_name},`
        : "Bonjour,",
      "",
      "Nous confirmons l'annulation de votre abonnement.",
      "Votre espace client reste accessible pour consulter l'historique.",
      "",
      `Espace client : ${dashboardLink}`,
      "",
      "L'équipe Hercule",
    ].join("\n"),
    idempotencyKey: `conference-cancel-client:${params.client.id}:${params.subscriptionId}`,
  });
  if (!clientResult.ok) {
    throw new Error(clientResult.error);
  }
}
