import { sendBookingEmail } from "@/lib/legacy/booking-communication/send";

import { HERCULE_OPS_EMAIL, isCheckoutPlaceholderEmail } from "../ops";
import { buildClientDashboardUrl } from "../supabase";
import type { ClientRow } from "../types";
import { formatParisDate, formatQuestionsBlock } from "./format";
import type { ClientAppointmentRow } from "./types";

function remainingLabel(client: ClientRow): string {
  const remaining = Math.max(0, client.rdv_total - client.rdv_used);
  return `${client.rdv_used} / ${client.rdv_total} (${remaining} restants)`;
}

export async function sendNewAppointmentEmails(params: {
  client: ClientRow;
  appointment: ClientAppointmentRow;
  overbooked: boolean;
}): Promise<void> {
  const { client, appointment } = params;
  const when = formatParisDate(appointment.scheduled_at);
  const questions = formatQuestionsBlock(appointment.questions);
  const dashboardUrl = buildClientDashboardUrl(client.slug);
  const displayName = client.first_name?.trim() || client.email;

  const body = [
    "Nouveau rendez-vous réservé.",
    "",
    `Date : ${when}`,
    `Prospect : ${appointment.invitee_name || "—"}`,
    `Email : ${appointment.invitee_email}`,
    appointment.join_url ? `Visio : ${appointment.join_url}` : null,
    "",
    "Questionnaire Calendly :",
    questions,
    "",
    `Dashboard : ${dashboardUrl}`,
    `Crédits : ${remainingLabel(client)}`,
    params.overbooked
      ? "Attention : ce rendez-vous dépasse le quota de crédits."
      : null,
    "",
    "Actions (dashboard client) : signaler no-show, refuser, replanifier.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const opsResult = await sendBookingEmail({
    to: HERCULE_OPS_EMAIL,
    subject: `Nouveau RDV client — ${displayName} · ${when}`,
    text: body,
    idempotencyKey: `client-appt-ops:${appointment.calendly_invitee_uri}`,
  });
  if (!opsResult.ok) {
    throw new Error(opsResult.error);
  }

  if (isCheckoutPlaceholderEmail(client.email)) {
    return;
  }

  const hostResult = await sendBookingEmail({
    to: client.email,
    subject: `Vous avez reçu un nouveau rendez-vous — ${when}`,
    text: [
      client.first_name ? `Bonjour ${client.first_name},` : "Bonjour,",
      "",
      "Un prospect vient de réserver un rendez-vous sur votre Calendly.",
      "",
      body,
      "",
      "L'équipe Hercule",
    ].join("\n"),
    idempotencyKey: `client-appt-host:${appointment.calendly_invitee_uri}`,
  });
  if (!hostResult.ok) {
    throw new Error(hostResult.error);
  }
}

export async function sendInviteeStatusEmail(params: {
  to: string;
  subject: string;
  text: string;
  idempotencyKey: string;
}): Promise<void> {
  const result = await sendBookingEmail(params);
  if (!result.ok) {
    throw new Error(result.error);
  }
}
