import {
  sendBookingEmail,
  type SendBookingEmailResult,
} from "@/lib/(resend)/communication/send";
import { conferenceOfferLabel } from "@/lib/commercial/conference-pricing";
import { buildClientDashboardUrl } from "@/lib/clients/supabase";
import type { ClientRow } from "@/lib/clients/types";
import {
  type ClientVideoConference,
  videoConferenceLabel,
  videoConferenceOpsAction,
} from "@/lib/clients/video-conference";

type OnboardingAnswersParams = {
  client: ClientRow;
  videoConference: ClientVideoConference;
  startNow: boolean;
  unavailability: string;
};

function verticalLabel(client: ClientRow): string {
  const primary = client.client_type.toUpperCase();
  return client.secondary_vertical
    ? `${primary} + ${client.secondary_vertical.toUpperCase()}`
    : primary;
}

export function buildOnboardingAnswersEmailBody(
  params: OnboardingAnswersParams & { audience: "ops" | "client" },
): string {
  const displayName = params.client.first_name?.trim() || params.client.email;
  const lines = [
    params.audience === "ops"
      ? "Un client a complété son onboarding."
      : "Voici la copie de vos réponses d'onboarding.",
    "",
    `Prénom : ${displayName}`,
    `Email : ${params.client.email}`,
    `Numéro de suivi : ${params.client.slug}`,
    `Verticale : ${verticalLabel(params.client)}`,
    `Formule : ${conferenceOfferLabel(params.client.offer_type)}`,
    `Visioconférence : ${videoConferenceLabel(params.videoConference)}`,
    `Démarrage immédiat : ${params.startNow ? "oui" : "non"}`,
    `Indisponibilités : ${params.unavailability}`,
  ];

  if (params.audience === "ops") {
    lines.push("", `Action : ${videoConferenceOpsAction(params.videoConference)}`);
  }

  lines.push("", `Dashboard : ${buildClientDashboardUrl(params.client.slug)}`);
  return lines.join("\n");
}

/** Best-effort: the onboarding is already saved, a failed email must not fail the request. */
export async function notifyOnboardingAnswers(
  params: OnboardingAnswersParams,
  options: { copyClient?: boolean } = {},
): Promise<void> {
  const displayName = params.client.first_name?.trim() || params.client.email;
  const opsEmail = process.env.NOTIFICATION_OPS_EMAIL?.trim();
  const clientEmail = params.client.email.trim();
  const sends: Array<Promise<SendBookingEmailResult>> = [];

  if (opsEmail) {
    sends.push(
      sendBookingEmail({
        to: opsEmail,
        subject: `[Onboarding] Réponses — ${displayName}`,
        text: buildOnboardingAnswersEmailBody({ ...params, audience: "ops" }),
        idempotencyKey: `client-onboarding-answers-ops:${params.client.id}`,
      }),
    );
  }

  if ((options.copyClient ?? true) && clientEmail && clientEmail !== opsEmail) {
    sends.push(
      sendBookingEmail({
        to: clientEmail,
        subject: "Vos réponses d'onboarding — Hercule",
        text: buildOnboardingAnswersEmailBody({ ...params, audience: "client" }),
        idempotencyKey: `client-onboarding-answers-client:${params.client.id}`,
      }),
    );
  }

  const results = await Promise.allSettled(sends);
  for (const result of results) {
    const error =
      result.status === "rejected"
        ? String(result.reason)
        : result.value.ok
          ? null
          : result.value.error;
    if (error) {
      console.error("[onboarding-answers] email failed", params.client.slug, error);
    }
  }
}
