import {
  sendBookingEmail,
  type SendBookingEmailResult,
} from "@/lib/(resend)/communication/send";
import { renderNotification } from "@/lib/(resend)/notifications/file-io";
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

export async function notifyDecFreeTrialOnboarding(params: {
  client: ClientRow;
  calendlySchedulingUrl: string;
  unavailability: string;
}): Promise<void> {
  const displayName = params.client.first_name?.trim() || params.client.email;
  const opsEmail = process.env.NOTIFICATION_OPS_EMAIL?.trim();
  const details = [
    `Prénom : ${displayName}`,
    `Email : ${params.client.email}`,
    `Slug : ${params.client.slug}`,
    `Calendly : ${params.calendlySchedulingUrl}`,
    `Indisponibilités : ${params.unavailability}`,
    "",
    "Pas de siège Calendly Pro / Zoom Pro pendant l'essai.",
    `Dashboard : ${buildClientDashboardUrl(params.client.slug)}`,
  ].join("\n");
  const rendered = renderNotification("free-trial-onboarding-ops", {
    displayName,
    details,
  });

  if (!opsEmail) return;

  try {
    await sendBookingEmail({
      to: opsEmail,
      subject: rendered.subject,
      text: rendered.text,
      idempotencyKey: `client-free-trial-onboarding-ops:${params.client.id}`,
    });
  } catch (error) {
    console.error(
      "[onboarding] free trial notify failed:",
      error instanceof Error ? error.message : error,
    );
  }
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
    const rendered = renderNotification("onboarding-answers-ops", {
      displayName,
      details: buildOnboardingAnswersEmailBody({ ...params, audience: "ops" })
        .split("\n")
        .slice(2)
        .join("\n"),
    });
    sends.push(
      sendBookingEmail({
        to: opsEmail,
        subject: rendered.subject,
        text: rendered.text,
        idempotencyKey: `client-onboarding-answers-ops:${params.client.id}`,
      }),
    );
  }

  if ((options.copyClient ?? true) && clientEmail && clientEmail !== opsEmail) {
    const rendered = renderNotification("onboarding-answers-client", {
      displayName,
      details: buildOnboardingAnswersEmailBody({ ...params, audience: "client" })
        .split("\n")
        .slice(2)
        .join("\n"),
    });
    sends.push(
      sendBookingEmail({
        to: clientEmail,
        subject: rendered.subject,
        text: rendered.text,
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
