import {
  conferenceCheckoutMode,
  type ConferenceOfferType,
} from "@/lib/commercial/conference-pricing";
import { isConferenceOfferType } from "@/lib/legacy/payments/conference-offers";
import {
  buildTrackingScript,
  formatTrackingLong,
  type TrackingScriptInput,
} from "@/lib/clients/tracking/script";

import type { ClientRow } from "./types";

export type RenewalChoice = "continue" | "pause";

export const MONTHLY_RENEWAL_J7_SENT_AT_KEY = "monthly_renewal_j7_sent_at";

export const MONTHLY_RENEWAL_EMAIL_SUBJECT =
  "Votre mensualité Hercule dans 7 jours — deux options";

export const MONTHLY_RENEWAL_CTA_PAUSE =
  "Je m'arrête — je voulais un coup ponctuel";

export const MONTHLY_RENEWAL_CTA_CONTINUE =
  "Je valide — Hercule lance ma croissance mensuelle";

export const STRIPE_PAUSE_COLLECTION = {
  pause_collection: { behavior: "void" as const },
};

const PARIS = "Europe/Paris";

export type RenewalPromptStatus = "show" | "expire" | "closed" | "hidden";

export function isRenewalChoice(value: unknown): value is RenewalChoice {
  return value === "continue" || value === "pause";
}

export function stripeUpdateForRenewalChoice(
  choice: RenewalChoice,
): typeof STRIPE_PAUSE_COLLECTION | null {
  if (choice === "continue") return null;
  return STRIPE_PAUSE_COLLECTION;
}

export function isMonthlyConferenceSubscription(
  client: Pick<ClientRow, "billing" | "offer_type" | "product_statut" | "stripe_subscription_id">,
): boolean {
  if (client.billing !== "monthly") return false;
  if (client.product_statut === "CANCELLED") return false;
  if (!client.stripe_subscription_id?.trim()) return false;
  if (!isConferenceOfferType(client.offer_type)) return false;
  return conferenceCheckoutMode(client.offer_type as ConferenceOfferType) === "subscription";
}

export function isFirstMonthlyCycle(succeededSubscriptionPaymentCount: number): boolean {
  return succeededSubscriptionPaymentCount === 1;
}

export function hasSentMonthlyRenewalJ7Email(
  profile: Record<string, unknown> | null,
): boolean {
  const value = profile?.[MONTHLY_RENEWAL_J7_SENT_AT_KEY];
  return typeof value === "string" && value.trim().length > 0;
}

type ParisParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function parisParts(date: Date): ParisParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: PARIS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
  };
}

function addCalendarDays(
  year: number,
  month: number,
  day: number,
  delta: number,
): { year: number; month: number; day: number } {
  const next = new Date(Date.UTC(year, month - 1, day));
  next.setUTCDate(next.getUTCDate() + delta);
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  };
}

/** UTC instant for a Paris wall-clock time. */
export function parisWallToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
): Date {
  let utc = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const seen = parisParts(new Date(utc));
    const seenAsUtc = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute, 0);
    const want = Date.UTC(year, month - 1, day, hour, minute, 0);
    const delta = want - seenAsUtc;
    if (delta === 0) break;
    utc += delta;
  }
  return new Date(utc);
}

/** [Paris midnight of periodEnd minus 7 calendar days, periodEnd). */
export function isInJ7Window(periodEnd: Date, now: Date): boolean {
  if (Number.isNaN(periodEnd.getTime()) || Number.isNaN(now.getTime())) return false;
  if (now.getTime() >= periodEnd.getTime()) return false;
  const end = parisParts(periodEnd);
  const startDay = addCalendarDays(end.year, end.month, end.day, -7);
  const windowStart = parisWallToUtc(startDay.year, startDay.month, startDay.day, 0, 0);
  return now.getTime() >= windowStart.getTime();
}

export function renewalPromptStatus(params: {
  client: Pick<
    ClientRow,
    | "billing"
    | "offer_type"
    | "product_statut"
    | "stripe_subscription_id"
    | "renewal_choice"
    | "renewal_prompt_closed_at"
  >;
  succeededSubscriptionPaymentCount: number;
  periodEnd: Date | null;
  now?: Date;
}): RenewalPromptStatus {
  if (params.client.renewal_choice || params.client.renewal_prompt_closed_at) {
    return "closed";
  }
  if (!isMonthlyConferenceSubscription(params.client)) return "hidden";
  if (!isFirstMonthlyCycle(params.succeededSubscriptionPaymentCount)) {
    return params.succeededSubscriptionPaymentCount > 1 ? "expire" : "hidden";
  }
  if (!params.periodEnd) return "hidden";
  const now = params.now ?? new Date();
  if (now.getTime() >= params.periodEnd.getTime()) return "expire";
  if (isInJ7Window(params.periodEnd, now)) return "show";
  return "hidden";
}

export function renewalAdminLabel(client: {
  renewal_choice: RenewalChoice | null;
  renewal_prompt_closed_at: string | null;
}): string {
  if (client.renewal_choice === "continue") return "Continue";
  if (client.renewal_choice === "pause") return "En pause";
  if (client.renewal_prompt_closed_at) return "Aucune réponse";
  return "—";
}

export function renewalAdminDetail(client: {
  renewal_choice: RenewalChoice | null;
  renewal_choice_at: string | null;
  renewal_prompt_closed_at: string | null;
}): string {
  if (client.renewal_choice === "continue") {
    return "Abonnement inchangé.";
  }
  if (client.renewal_choice === "pause") {
    return "Abonnement mis en pause. Les rendez-vous restants continuent.";
  }
  if (client.renewal_prompt_closed_at) {
    return "Aucune réponse — abonnement inchangé.";
  }
  return "Pas encore demandé.";
}

export function standardOptionBody(params: {
  rdvRemaining: number;
  volumeEndLabel: string;
}): string {
  const remaining = Math.max(0, params.rdvRemaining);
  const deadline = params.volumeEndLabel.trim() || "la date de fin affichée sur votre suivi";
  return `Si vous mettez votre abonnement en pause, la machine ne s'arrête pas. Vos ${remaining} rendez-vous restants sont livrés à un rythme maîtrisé, jusqu'au ${deadline}.`;
}

export function eliteOptionBody(): string {
  return "En validant votre mensualité, vous conservez la file d'attente prioritaire : les rendez-vous arrivent plus vite, et les suivants aussi.";
}

export function volumeEndLabelForAnnouncement(
  input: Omit<TrackingScriptInput, "now"> & { now?: Date },
): string {
  const now = input.now ?? new Date();
  const script = buildTrackingScript({ ...input, now });
  if (script.volumeEndAt) return formatTrackingLong(script.volumeEndAt);

  const projected = buildTrackingScript({
    ...input,
    now,
    retraction: input.retraction
      ? { ...input.retraction, status: "waived" }
      : null,
  });
  if (!projected.volumeEndAt) return "";
  return formatTrackingLong(projected.volumeEndAt);
}

export function buildMonthlyRenewalEmailText(params: {
  firstName: string | null;
  rdvRemaining: number;
  volumeEndLabel: string;
  dashboardUrl: string;
}): string {
  const greeting = params.firstName?.trim()
    ? `Bonjour ${params.firstName.trim()},`
    : "Bonjour,";
  return [
    greeting,
    "",
    "Dans 7 jours, votre prochaine mensualité Hercule arrive. C'est la seule fois où nous vous posons cette question.",
    "",
    "Option courante — vitesse standard",
    standardOptionBody({
      rdvRemaining: params.rdvRemaining,
      volumeEndLabel: params.volumeEndLabel,
    }),
    MONTHLY_RENEWAL_CTA_PAUSE,
    "",
    "Option élite — vitesse accélérée",
    eliteOptionBody(),
    MONTHLY_RENEWAL_CTA_CONTINUE,
    "",
    `Choisissez depuis votre espace client : ${params.dashboardUrl}`,
    "",
    "L'équipe Hercule",
  ].join("\n");
}
