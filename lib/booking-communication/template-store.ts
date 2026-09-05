import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import { confirmationAgenceLinkFor } from "@/lib/link-tracking/urls";
import type { LeadCategory, LinkTrackingLead } from "@/lib/link-tracking/types";

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
import { finalizeRenderedEmail } from "./signatures";
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
];

const ENTREPRISE_EMAIL_TYPES: BookingEmailType[] = [
  "immediate",
  "h48_confirm",
  "h24_relance",
];

function emailTypesForCategory(category: LeadCategory): BookingEmailType[] {
  return category === "entreprise" ? ENTREPRISE_EMAIL_TYPES : AGENCE_EMAIL_TYPES;
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
  if (category !== "entreprise") {
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

const SAMPLE_CONFIRM_URL =
  "https://www.hercule.dev/confirm-reservation.html/exemple-slug?email=jean@example.com";
const SAMPLE_TEMPORARY_URL =
  "https://www.hercule.dev/temporary-reservation.html/exemple-slug?email=jean@example.com";

export function buildBookingEmailVars(params: {
  firstName: string | null;
  scheduledAt: string | null;
  confirmUrl: string;
  emailType: BookingEmailType;
  postBookingUrl?: string;
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
  };
  if (params.emailType === "immediate") {
    delete vars.confirmUrl;
    delete vars.confirmation_agence_link;
    delete vars.confirmLink;
    delete vars.post_booking_link;
  }
  return vars;
}

export function sampleBookingEmailVars(
  emailType: BookingEmailType,
): Record<string, string> {
  const confirmUrl =
    emailType === "role_seq_24" ? SAMPLE_TEMPORARY_URL : SAMPLE_CONFIRM_URL;
  return buildBookingEmailVars({
    firstName: "Jean",
    scheduledAt: "2026-09-10T09:00:00+02:00",
    confirmUrl,
    emailType,
  });
}

export function confirmUrlForLead(
  lead: LinkTrackingLead,
  emailType: BookingEmailType,
  category: LeadCategory = "agence",
): string {
  if (emailType === "role_seq_24") {
    return buildTemporaryConfirmUrl(lead.slug, lead.email);
  }
  if (category === "entreprise" && emailType === "h48_confirm") {
    return buildEntreprisePostBookingUrl(lead.slug, lead.email);
  }
  if (category === "entreprise" && emailType === "h24_relance") {
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
}): { subject: string; body: string } {
  const defaults = defaultBookingEmailTemplate(params.category, params.emailType);
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
  const resolvedSubject = stored?.subject?.trim() || defaults.subject;
  const resolvedBody = stored?.body?.trim() || defaults.body;

  return {
    subject: editorSubject || resolvedSubject,
    body: editorBody || resolvedBody,
  };
}

export async function resolveBookingEmailTemplate(params: {
  category: LeadCategory;
  emailType: BookingEmailType;
  subject?: string;
  body?: string;
}): Promise<{ subject: string; body: string }> {
  const templates = await getBookingEmailTemplates(params.category);
  const stored = templates.find((row) => row.email_type === params.emailType);
  return pickBookingEmailTemplate({
    category: params.category,
    emailType: params.emailType,
    subject: params.subject,
    body: params.body,
    stored: stored ?? null,
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
}): Promise<RenderedBookingEmail> {
  const template = await resolveBookingEmailTemplate({
    category: params.category,
    emailType: params.emailType,
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
}): Promise<RenderedBookingEmail> {
  const vars = buildBookingEmailVars({
    firstName: params.firstName,
    scheduledAt: params.scheduledAt,
    confirmUrl: params.confirmUrl,
    emailType: params.emailType,
    postBookingUrl: params.confirmUrl,
  });

  return finalizeRenderedEmail({
    category: params.category,
    subject: renderTemplate(params.subject, vars),
    body: renderTemplate(params.body, vars),
    emailType: params.emailType,
    confirmUrl: params.confirmUrl,
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
  return finalizeRenderedEmail({
    category,
    subject: renderTemplate(subject, vars),
    body: renderTemplate(body, vars),
    emailType,
    confirmUrl: vars.confirmUrl ?? vars.confirmation_agence_link ?? "",
    useHtml,
    meetingActionLinks: shouldIncludeMeetingActions(emailType)
      ? sampleMeetingActionLinks()
      : undefined,
  });
}
