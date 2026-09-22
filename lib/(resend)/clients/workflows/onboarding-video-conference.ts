import { sendBookingEmail } from "@/lib/(resend)/communication/send";
import { conferenceOfferLabel } from "@/lib/commercial/conference-pricing";
import { buildClientDashboardUrl } from "@/lib/clients/supabase";
import type { ClientRow } from "@/lib/clients/types";
import {
  type ClientVideoConference,
  videoConferenceLabel,
  videoConferenceOpsAction,
} from "@/lib/clients/video-conference";

export function buildOnboardingVideoConferenceEmailBody(params: {
  client: ClientRow;
  videoConference: ClientVideoConference;
}): string {
  const displayName = params.client.first_name?.trim() || params.client.email;
  const dashboardLink = buildClientDashboardUrl(params.client.slug);
  const visioLabel = videoConferenceLabel(params.videoConference);

  return [
    "Un client a complété son onboarding et a indiqué son choix de visioconférence.",
    "",
    `Prénom : ${displayName}`,
    `Email : ${params.client.email}`,
    `Slug : ${params.client.slug}`,
    `Verticale : ${params.client.client_type}`,
    `Formule : ${conferenceOfferLabel(params.client.offer_type)}`,
    `Visioconférence : ${visioLabel}`,
    "",
    `Action : ${videoConferenceOpsAction(params.videoConference)}`,
    "",
    `Dashboard : ${dashboardLink}`,
  ].join("\n");
}

export async function notifyOnboardingVideoConference(params: {
  client: ClientRow;
  videoConference: ClientVideoConference;
}): Promise<void> {
  const opsEmail = process.env.NOTIFICATION_OPS_EMAIL?.trim();
  if (!opsEmail) {
    return;
  }

  const displayName = params.client.first_name?.trim() || params.client.email;
  const visioLabel = videoConferenceLabel(params.videoConference);

  const result = await sendBookingEmail({
    to: opsEmail,
    subject: `[Onboarding] Visioconférence — ${displayName} · ${visioLabel}`,
    text: buildOnboardingVideoConferenceEmailBody(params),
    idempotencyKey: `client-onboarding-visio-ops:${params.client.id}`,
  });

  if (!result.ok) {
    throw new Error(result.error);
  }
}
