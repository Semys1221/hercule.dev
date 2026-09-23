import { isPaymentOnboardingEmailType } from "@/lib/(resend)/onboarding/constants";
import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import { confirmationAgenceLinkFor } from "@/lib/legacy/link-tracking/urls";
import { modalitesConfirmUrlFor } from "@/lib/legacy/modalites-campaign/urls";
import type { LeadCategory, LinkTrackingLead } from "@/lib/legacy/link-tracking/types";

import {
  buildEntreprisePostBookingUrl,
  buildFirstNameLine,
  buildTemporaryConfirmUrl,
  defaultBookingEmailTemplate,
  formatMeetingDateTime,
  renderTemplate,
} from "./templates";
import {
  sampleMeetingActionLinks,
  shouldIncludeMeetingActions,
} from "./meeting-links";
import { finalizeRenderedEmail, isConferenceInviteBookingEmail } from "./signatures";
import type { MeetingActionLinks } from "./meeting-links";
import type { BookingEmailType, RenderedBookingEmail } from "./types";

export type StoredBookingEmailTemplate = {
  email_type: BookingEmailType;
  subject: string;
  body: string;
  updated_at: string | null;
};

const AGENCE_EMAIL_TYPES: BookingEmailType[] = [
  "immediate",
  "h48_confirm",
  "h24_relance",
  "h20_cancel",
  "role_seq_48",
  "role_seq_24",
  "product_calendly_welcome",
  "product_calendly_reminder",
  "product_payment_welcome",
  "upsell_email_1",
  "upsell_email_2",
  "upsell_email_3",
  "close_indecis_1",
  "close_indecis_2",
  "close_indecis_3",
  "no_show_indecis_1",
  "no_show_indecis_2",
  "no_show_indecis_3",
  "onboarding_retraction_hold",
  "onboarding_j0",
  "onboarding_j0_bis",
  "onboarding_j1",
  "onboarding_reminder_m10",
  "onboarding_reminder_m5",
  "onboarding_reminder_p5",
  "deliverance_search_started",
  "deliverance_d7_update",
  "deliverance_milestone",
  "deliverance_waitlist",
  "match_booking_agence",
  "survey_rdv_agence",
  "survey_rdv_agence_followup",
  "sold_check_j7",
  "payment_notification_client",
  "modalites_ask",
  "modalites_cancel",
  "comptable_acquisition_welcome",
  "comptable_acquisition_config_ready",
  "comptable_acquisition_rdv_reminder",
  "comptable_acquisition_rdv_final",
  "proposition_ludovic_welcome",
  "proposition_ludovic_config_ready",
  "proposition_ludovic_rdv_reminder",
  "proposition_ludovic_rdv_final",
  "free_trial_1",
  "free_trial_2",
  "free_trial_3",
  "free_trial_started_1",
  "free_trial_started_2",
  "free_trial_started_3",
  "payment_onboarding_1",
  "payment_onboarding_2",
  "payment_onboarding_3",
  "payment_onboarding_4",
  "payment_onboarding_5",
  "payment_onboarding_6",
  "payment_onboarding_7",
  "payment_onboarding_8",
  "payment_onboarding_9",
];

const ENTREPRISE_EMAIL_TYPES: BookingEmailType[] = [
  "immediate",
  "h48_confirm",
  "h24_relance",
  "role_seq_48",
  "role_seq_24",
  "product_calendly_welcome",
  "product_calendly_reminder",
  "product_payment_welcome",
  "close_indecis_1",
  "close_indecis_2",
  "close_indecis_3",
  "no_show_indecis_1",
  "no_show_indecis_2",
  "no_show_indecis_3",
  "deliverance_search_started",
  "deliverance_d7_update",
  "deliverance_milestone",
  "deliverance_waitlist",
  "match_proposal",
  "match_proposal_followup",
  "match_booking_agence",
  "survey_rdv_entreprise",
  "survey_rdv_entreprise_followup",
  "sold_check_j7",
  "payment_notification_client",
  "modalites_ask",
  "modalites_cancel",
  "payment_onboarding_1",
  "payment_onboarding_2",
  "payment_onboarding_3",
  "payment_onboarding_4",
  "payment_onboarding_5",
  "payment_onboarding_6",
  "payment_onboarding_7",
  "payment_onboarding_8",
  "payment_onboarding_9",
];

const CIF_EMAIL_TYPES: BookingEmailType[] = [
  "conference_invite",
  "conference_invite_24",
  "conference_invite_48",
  "conference_invite_72",
  "payment_onboarding_1",
  "payment_onboarding_2",
  "payment_onboarding_3",
  "payment_onboarding_4",
  "payment_onboarding_5",
  "payment_onboarding_6",
  "payment_onboarding_7",
  "payment_onboarding_8",
  "payment_onboarding_9",
];

function emailTypesForCategory(category: LeadCategory): BookingEmailType[] {
  if (category === "cif") return CIF_EMAIL_TYPES;
  if (category === "entreprise") return ENTREPRISE_EMAIL_TYPES;
  if (category === "client") {
    return [
      "product_payment_welcome",
      "payment_onboarding_1",
      "payment_onboarding_2",
      "payment_onboarding_3",
      "payment_onboarding_4",
      "payment_onboarding_5",
      "payment_onboarding_6",
      "payment_onboarding_7",
      "payment_onboarding_8",
      "payment_onboarding_9",
      "product_calendly_welcome",
      "product_calendly_reminder",
    ] as BookingEmailType[];
  }
  return AGENCE_EMAIL_TYPES;
}

export function isProductBookingEmailType(emailType: BookingEmailType): boolean {
  return (
    emailType === "product_calendly_welcome" ||
    emailType === "product_calendly_reminder" ||
    emailType === "product_payment_welcome" ||
    emailType.startsWith("upsell_") ||
    emailType.startsWith("close_indecis_") ||
    emailType.startsWith("no_show_indecis_") ||
    emailType.startsWith("onboarding_") ||
    emailType.startsWith("deliverance_") ||
    emailType.startsWith("match_") ||
    emailType.startsWith("survey_") ||
    emailType === "sold_check_j7" ||
    emailType === "payment_notification_client" ||
    emailType.startsWith("comptable_acquisition_") ||
    emailType.startsWith("proposition_ludovic_") ||
    emailType.startsWith("conference_invite") ||
    emailType.startsWith("free_trial") ||
    emailType.startsWith("payment_onboarding_")
  );
}

const STALE_ENTREPRISE_MARKERS = [
  "réattribué",
  "confirmation_agence_link",
  "confirmer votre présence",
  "confirmation requise",
] as const;

export function isStaleAgenceCopyOnEntreprise(
  category: LeadCategory,
  emailType: BookingEmailType,
  subject: string,
  body: string,
): boolean {
  if (category !== "entreprise" && category !== "comptable") {
    return false;
  }
  if (emailType !== "h48_confirm" && emailType !== "h24_relance") {
    return false;
  }
  const combined = `${subject}\n${body}`.toLowerCase();
  return STALE_ENTREPRISE_MARKERS.some((marker) =>
    combined.includes(marker.toLowerCase()),
  );
}

function sanitizeStoredTemplate(
  category: LeadCategory,
  emailType: BookingEmailType,
  row: StoredBookingEmailTemplate,
): StoredBookingEmailTemplate {
  const subject = row.subject?.trim() ?? "";
  const body = row.body?.trim() ?? "";
  if (
    !subject ||
    !body ||
    isStaleAgenceCopyOnEntreprise(category, emailType, subject, body)
  ) {
    const defaults = defaultBookingEmailTemplate(category, emailType);
    return {
      email_type: emailType,
      subject: defaults.subject,
      body: defaults.body,
      updated_at: row.updated_at,
    };
  }
  return row;
}

function defaultTemplatesForCategory(
  category: LeadCategory,
): StoredBookingEmailTemplate[] {
  return emailTypesForCategory(category).map((email_type) => {
    const defaults = defaultBookingEmailTemplate(category, email_type);
    return {
      email_type,
      subject: defaults.subject,
      body: defaults.body,
      updated_at: null,
    };
  });
}

export async function getBookingEmailTemplates(
  category: LeadCategory,
): Promise<StoredBookingEmailTemplate[]> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("booking_email_templates")
    .select("email_type, subject, body, updated_at")
    .eq("category", category);

  if (error) {
    console.warn(
      "[booking-communication] template fetch failed, using defaults:",
      error.message,
    );
    return defaultTemplatesForCategory(category);
  }

  const rows = (data ?? []) as StoredBookingEmailTemplate[];
  if (rows.length === 0) {
    return defaultTemplatesForCategory(category);
  }

  const byType = new Map(rows.map((row) => [row.email_type, row]));
  return emailTypesForCategory(category).map((email_type) => {
    const row = byType.get(email_type);
    if (row) {
      return sanitizeStoredTemplate(category, email_type, row);
    }
    const defaults = defaultBookingEmailTemplate(category, email_type);
    return {
      email_type,
      subject: defaults.subject,
      body: defaults.body,
      updated_at: null,
    };
  });
}

export async function upsertBookingEmailTemplates(
  category: LeadCategory,
  templates: Array<{
    email_type: BookingEmailType;
    subject: string;
    body: string;
  }>,
): Promise<void> {
  const client = createLinkTrackingClient();
  const now = new Date().toISOString();
  const rows = templates.map((template) => ({
    category,
    email_type: template.email_type,
    subject: template.subject.trim(),
    body: template.body,
    updated_at: now,
  }));

  const { error } = await client
    .from("booking_email_templates")
    .upsert(rows, { onConflict: "category,email_type" });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteBookingEmailTemplates(
  category: LeadCategory,
  emailTypes: BookingEmailType[],
): Promise<void> {
  if (emailTypes.length === 0) return;
  const client = createLinkTrackingClient();
  const { error } = await client
    .from("booking_email_templates")
    .delete()
    .eq("category", category)
    .in("email_type", emailTypes);
  if (error) {
    throw new Error(error.message);
  }
}

const SAMPLE_CONFIRM_URL =
  "https://www.hercule.dev/confirm-reservation.html/exemple-slug?email=jean@example.com";
const SAMPLE_TEMPORARY_URL =
  "https://www.hercule.dev/temporary-reservation.html/exemple-slug?email=jean@example.com";
const SAMPLE_MODALITES_URL =
  "https://www.hercule.dev/modalites-hercule.html?code=exemple-slug&email=jean@example.com";

export function buildBookingEmailVars(params: {
  firstName: string | null;
  scheduledAt: string | null;
  confirmUrl: string;
  emailType: BookingEmailType;
  postBookingUrl?: string;
  dashboardLink?: string;
  reservationAgenceLink?: string;
  company?: string | null;
  email?: string;
  surveyLink?: string;
  agenceInfo?: string;
  entrepriseInfo?: string;
  calendlyLink?: string;
  estimatedFirstBookingDate?: string;
  estimatedFirstRdvDate?: string;
  trackingNumber?: string;
  rdvRangeLabel?: string;
  reservationCifLink?: string;
  billingPortalLink?: string;
  checkoutTrialLink?: string;
}): Record<string, string> {
  const { date, heure } = formatMeetingDateTime(params.scheduledAt);
  const confirmUrl = params.confirmUrl.trim();
  const postBookingUrl = params.postBookingUrl?.trim() || confirmUrl;
  const vars: Record<string, string> = {
    firstNameLine: buildFirstNameLine(params.firstName, params.emailType),
    date,
    heure,
    confirmUrl,
    confirmation_agence_link: confirmUrl,
    confirmLink: confirmUrl ? `confirmer : ${confirmUrl}` : "",
    post_booking_link: postBookingUrl,
    dashboardLink: params.dashboardLink?.trim() ?? "",
    reservation_agence_link: params.reservationAgenceLink?.trim() ?? "",
    company: params.company?.trim() ?? "",
    email: params.email?.trim() ?? "",
    surveyLink: params.surveyLink?.trim() ?? "",
    agenceInfo: params.agenceInfo?.trim() ?? "",
    entrepriseInfo: params.entrepriseInfo?.trim() ?? "",
    calendlyLink: params.calendlyLink?.trim() ?? "",
    estimatedFirstBookingDate: params.estimatedFirstBookingDate?.trim() ?? "",
    estimatedFirstRdvDate:
      params.estimatedFirstRdvDate?.trim() ||
      params.estimatedFirstBookingDate?.trim() ||
      "",
    trackingNumber: params.trackingNumber?.trim() ?? "",
    rdvRangeLabel: params.rdvRangeLabel?.trim() ?? "",
    reservation_cif_link: params.reservationCifLink?.trim() ?? "",
    billingPortalLink: params.billingPortalLink?.trim() ?? "",
    checkoutTrialLink: params.checkoutTrialLink?.trim() ?? "",
  };
  if (params.emailType === "immediate") {
    delete vars.confirmUrl;
    delete vars.confirmation_agence_link;
    delete vars.confirmLink;
    delete vars.post_booking_link;
  }
  if (isProductBookingEmailType(params.emailType)) {
    delete vars.confirmUrl;
    delete vars.confirmation_agence_link;
    delete vars.confirmLink;
    delete vars.post_booking_link;
    if (params.emailType !== "match_booking_agence") {
      delete vars.date;
      delete vars.heure;
    }
  }
  return vars;
}

export function sampleBookingEmailVars(
  emailType: BookingEmailType,
): Record<string, string> {
  const confirmUrl =
    emailType === "role_seq_24"
      ? SAMPLE_TEMPORARY_URL
      : emailType === "modalites_ask" || emailType === "modalites_cancel"
        ? SAMPLE_MODALITES_URL
        : SAMPLE_CONFIRM_URL;
  const vars = buildBookingEmailVars({
    firstName: "Jean",
    scheduledAt: "2026-09-10T09:00:00+02:00",
    confirmUrl,
    emailType,
    dashboardLink: "https://www.hercule.dev/dashboard/exemple-slug",
    reservationAgenceLink: "https://www.hercule.dev/reservation/exemple-slug",
    company: "Exemple SARL",
    email: "jean@example.com",
    surveyLink: "https://www.hercule.dev/survey/exemple-token",
    agenceInfo: "Agence Exemple — Bordeaux",
    entrepriseInfo: "Entreprise Exemple — Paris",
    calendlyLink: "https://calendly.com/exemple?utm_content=match:demo",
    estimatedFirstBookingDate: "lundi 21 septembre 2026",
    estimatedFirstRdvDate: "lundi 21 septembre 2026",
    trackingNumber: "HRC-exemple",
    rdvRangeLabel: "10 à 15",
    reservationCifLink:
      "https://www.hercule.dev/reservation/exemple-slug",
  });
  return vars;
}

export function confirmUrlForLead(
  lead: LinkTrackingLead,
  emailType: BookingEmailType,
  category: LeadCategory = "agence",
): string {
  if (emailType === "modalites_ask" || emailType === "modalites_cancel") {
    return modalitesConfirmUrlFor(lead, { autoConfirm: true });
  }
  if (emailType === "role_seq_24") {
    return buildTemporaryConfirmUrl(lead.slug, lead.email);
  }
  if (
    (category === "entreprise" || category === "comptable" || category === "cif") &&
    emailType === "h48_confirm"
  ) {
    return buildEntreprisePostBookingUrl(lead.slug, lead.email);
  }
  if (
    (category === "entreprise" || category === "comptable" || category === "cif") &&
    emailType === "h24_relance"
  ) {
    return "";
  }
  return confirmationAgenceLinkFor(lead);
}

export function pickBookingEmailTemplate(params: {
  category: LeadCategory;
  emailType: BookingEmailType;
  subject?: string;
  body?: string;
  stored?: Pick<StoredBookingEmailTemplate, "subject" | "body"> | null;
  verticalOverride?: "dec" | "cif" | "ias" | null;
}): { subject: string; body: string } {
  const defaults = defaultBookingEmailTemplate(
    params.category,
    params.emailType,
    params.verticalOverride,
  );
  const editorSubject = params.subject?.trim() ?? "";
  const editorBody = params.body?.trim() ?? "";

  const stored = params.stored
    ? sanitizeStoredTemplate(params.category, params.emailType, {
        email_type: params.emailType,
        subject: params.stored.subject,
        body: params.stored.body,
        updated_at: null,
      })
    : null;
  const storedSubject = stored?.subject?.trim() || "";
  const storedBody = stored?.body?.trim() || "";
  const preferred = preferPaymentOnboardingMarkdown({
    category: params.category,
    emailType: params.emailType,
    verticalOverride: params.verticalOverride,
    markdown: defaults,
    storedSubject,
    storedBody,
  });

  return {
    subject: editorSubject || preferred.subject,
    body: editorBody || preferred.body,
  };
}

/**
 * Client rows synthesize payment-onboarding stubs without a vertical.
 * Those stubs, and any stored body missing {{dashboardLink}}, must not
 * replace the vertical markdown that carries the client dashboard URL.
 */
function preferPaymentOnboardingMarkdown(params: {
  category: LeadCategory;
  emailType: BookingEmailType;
  verticalOverride?: "dec" | "cif" | "ias" | null;
  markdown: { subject: string; body: string };
  storedSubject: string;
  storedBody: string;
}): { subject: string; body: string } {
  const fallback = {
    subject: params.storedSubject || params.markdown.subject,
    body: params.storedBody || params.markdown.body,
  };
  if (!params.verticalOverride || !isPaymentOnboardingEmailType(params.emailType)) {
    return fallback;
  }
  if (!params.markdown.body.includes("{{dashboardLink}}")) {
    return fallback;
  }

  const stub = defaultBookingEmailTemplate(params.category, params.emailType);
  const body = params.storedBody;
  if (!body || !body.includes("{{dashboardLink}}") || body === stub.body.trim()) {
    return params.markdown;
  }
  return fallback;
}

export async function resolveBookingEmailTemplate(params: {
  category: LeadCategory;
  emailType: BookingEmailType;
  subject?: string;
  body?: string;
  verticalOverride?: "dec" | "cif" | "ias" | null;
}): Promise<{ subject: string; body: string }> {
  const templates = await getBookingEmailTemplates(params.category);
  const stored = templates.find((row) => row.email_type === params.emailType);
  return pickBookingEmailTemplate({
    category: params.category,
    emailType: params.emailType,
    subject: params.subject,
    body: params.body,
    stored: stored ?? null,
    verticalOverride: params.verticalOverride,
  });
}

export async function renderEmailFromStore(params: {
  category: LeadCategory;
  emailType: BookingEmailType;
  firstName: string | null;
  scheduledAt: string | null;
  confirmUrl: string;
  useHtml?: boolean;
  meetingActionLinks?: MeetingActionLinks;
  dashboardLink?: string;
  reservationAgenceLink?: string;
  company?: string | null;
  email?: string;
  surveyLink?: string;
  agenceInfo?: string;
  entrepriseInfo?: string;
  calendlyLink?: string;
  estimatedFirstBookingDate?: string;
  estimatedFirstRdvDate?: string;
  trackingNumber?: string;
  rdvRangeLabel?: string;
  reservationCifLink?: string;
  verticalOverride?: "dec" | "cif" | "ias" | null;
}): Promise<RenderedBookingEmail> {
  const template = await resolveBookingEmailTemplate({
    category: params.category,
    emailType: params.emailType,
    verticalOverride: params.verticalOverride,
  });

  return renderCustomBookingEmail({
    subject: template.subject,
    body: template.body,
    category: params.category,
    emailType: params.emailType,
    firstName: params.firstName,
    scheduledAt: params.scheduledAt,
    confirmUrl: params.confirmUrl,
    useHtml: params.useHtml,
    meetingActionLinks: params.meetingActionLinks,
    dashboardLink: params.dashboardLink,
    reservationAgenceLink: params.reservationAgenceLink,
    company: params.company,
    email: params.email,
    surveyLink: params.surveyLink,
    agenceInfo: params.agenceInfo,
    entrepriseInfo: params.entrepriseInfo,
    calendlyLink: params.calendlyLink,
    estimatedFirstBookingDate: params.estimatedFirstBookingDate,
    estimatedFirstRdvDate: params.estimatedFirstRdvDate,
    trackingNumber: params.trackingNumber,
    rdvRangeLabel: params.rdvRangeLabel,
    reservationCifLink: params.reservationCifLink,
  });
}

export async function renderCustomBookingEmail(params: {
  category: LeadCategory;
  subject: string;
  body: string;
  emailType: BookingEmailType;
  firstName: string | null;
  scheduledAt: string | null;
  confirmUrl: string;
  useHtml?: boolean;
  meetingActionLinks?: MeetingActionLinks;
  dashboardLink?: string;
  reservationAgenceLink?: string;
  company?: string | null;
  email?: string;
  surveyLink?: string;
  agenceInfo?: string;
  entrepriseInfo?: string;
  calendlyLink?: string;
  estimatedFirstBookingDate?: string;
  estimatedFirstRdvDate?: string;
  trackingNumber?: string;
  rdvRangeLabel?: string;
  reservationCifLink?: string;
  billingPortalLink?: string;
  checkoutTrialLink?: string;
}): Promise<RenderedBookingEmail> {
  const vars = buildBookingEmailVars({
    firstName: params.firstName,
    scheduledAt: params.scheduledAt,
    confirmUrl: params.confirmUrl,
    emailType: params.emailType,
    postBookingUrl: params.confirmUrl,
    dashboardLink: params.dashboardLink,
    reservationAgenceLink: params.reservationAgenceLink,
    company: params.company,
    email: params.email,
    surveyLink: params.surveyLink,
    agenceInfo: params.agenceInfo,
    entrepriseInfo: params.entrepriseInfo,
    calendlyLink: params.calendlyLink,
    estimatedFirstBookingDate: params.estimatedFirstBookingDate,
    estimatedFirstRdvDate: params.estimatedFirstRdvDate,
    trackingNumber: params.trackingNumber,
    rdvRangeLabel: params.rdvRangeLabel,
    reservationCifLink: params.reservationCifLink,
    billingPortalLink: params.billingPortalLink,
    checkoutTrialLink: params.checkoutTrialLink,
  });

  const reservationLink = vars.reservation_cif_link?.trim() ?? "";
  const confirmUrl =
    isConferenceInviteBookingEmail(params.emailType) && reservationLink
      ? reservationLink
      : params.confirmUrl;

  return finalizeRenderedEmail({
    category: params.category,
    subject: renderTemplate(params.subject, vars),
    body: renderTemplate(params.body, vars),
    emailType: params.emailType,
    confirmUrl,
    useHtml: params.useHtml,
    meetingActionLinks: params.meetingActionLinks,
  });
}

/** Client-side preview helper (no DB fetch). */
export async function previewTemplate(
  subject: string,
  body: string,
  emailType: BookingEmailType,
  useHtml?: boolean,
  category: LeadCategory = "agence",
): Promise<RenderedBookingEmail> {
  const vars = sampleBookingEmailVars(emailType);
  const confirmUrl = isConferenceInviteBookingEmail(emailType)
    ? vars.reservation_cif_link?.trim() || vars.confirmUrl || vars.confirmation_agence_link || ""
    : vars.confirmUrl ?? vars.confirmation_agence_link ?? "";
  return finalizeRenderedEmail({
    category,
    subject: renderTemplate(subject, vars),
    body: renderTemplate(body, vars),
    emailType,
    confirmUrl: confirmUrl,
    useHtml,
    meetingActionLinks: shouldIncludeMeetingActions(emailType)
      ? sampleMeetingActionLinks()
      : undefined,
  });
}
