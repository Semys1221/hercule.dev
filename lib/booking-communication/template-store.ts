import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import { confirmationAgenceLinkFor } from "@/lib/link-tracking/urls";
import type { LeadCategory, LinkTrackingLead } from "@/lib/link-tracking/types";

import {
  buildFirstNameLine,
  buildTemporaryConfirmUrl,
  DEFAULT_BOOKING_EMAIL_TEMPLATES,
  formatMeetingDateTime,
  renderTemplate,
} from "./templates";
import { finalizeRenderedEmail } from "./signatures";
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

const ENTREPRISE_EMAIL_TYPES: BookingEmailType[] = ["immediate"];

function emailTypesForCategory(category: LeadCategory): BookingEmailType[] {
  return category === "entreprise" ? ENTREPRISE_EMAIL_TYPES : AGENCE_EMAIL_TYPES;
}

function defaultTemplatesForCategory(
  category: LeadCategory,
): StoredBookingEmailTemplate[] {
  return emailTypesForCategory(category).map((email_type) => ({
    email_type,
    subject: DEFAULT_BOOKING_EMAIL_TEMPLATES[email_type].subject,
    body: DEFAULT_BOOKING_EMAIL_TEMPLATES[email_type].body,
    updated_at: null,
  }));
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
    if (row) return row;
    const defaults = DEFAULT_BOOKING_EMAIL_TEMPLATES[email_type];
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
}): Record<string, string> {
  const { date, heure } = formatMeetingDateTime(params.scheduledAt);
  const confirmUrl = params.confirmUrl.trim();
  const vars: Record<string, string> = {
    firstNameLine: buildFirstNameLine(params.firstName, params.emailType),
    date,
    heure,
    confirmUrl,
    confirmation_agence_link: confirmUrl,
    confirmLink: confirmUrl ? `confirmer : ${confirmUrl}` : "",
  };
  if (params.emailType === "immediate") {
    delete vars.confirmUrl;
    delete vars.confirmation_agence_link;
    delete vars.confirmLink;
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
): string {
  if (emailType === "role_seq_24") {
    return buildTemporaryConfirmUrl(lead.slug, lead.email);
  }
  return confirmationAgenceLinkFor(lead);
}

export async function renderEmailFromStore(params: {
  category: LeadCategory;
  emailType: BookingEmailType;
  firstName: string | null;
  scheduledAt: string | null;
  confirmUrl: string;
  useHtml?: boolean;
}): Promise<RenderedBookingEmail> {
  const templates = await getBookingEmailTemplates(params.category);
  const template = templates.find((row) => row.email_type === params.emailType);
  if (!template) {
    throw new Error(`missing_template:${params.emailType}`);
  }

  const vars = buildBookingEmailVars({
    firstName: params.firstName,
    scheduledAt: params.scheduledAt,
    confirmUrl: params.confirmUrl,
    emailType: params.emailType,
  });

  return finalizeRenderedEmail({
    subject: renderTemplate(template.subject, vars),
    body: renderTemplate(template.body, vars),
    emailType: params.emailType,
    confirmUrl: params.confirmUrl,
    useHtml: params.useHtml,
  });
}

export async function renderCustomBookingEmail(params: {
  subject: string;
  body: string;
  emailType: BookingEmailType;
  firstName: string | null;
  scheduledAt: string | null;
  confirmUrl: string;
  useHtml?: boolean;
}): Promise<RenderedBookingEmail> {
  const vars = buildBookingEmailVars({
    firstName: params.firstName,
    scheduledAt: params.scheduledAt,
    confirmUrl: params.confirmUrl,
    emailType: params.emailType,
  });

  return finalizeRenderedEmail({
    subject: renderTemplate(params.subject, vars),
    body: renderTemplate(params.body, vars),
    emailType: params.emailType,
    confirmUrl: params.confirmUrl,
    useHtml: params.useHtml,
  });
}

/** Client-side preview helper (no DB fetch). */
export async function previewTemplate(
  subject: string,
  body: string,
  emailType: BookingEmailType,
  useHtml?: boolean,
): Promise<RenderedBookingEmail> {
  const vars = sampleBookingEmailVars(emailType);
  return finalizeRenderedEmail({
    subject: renderTemplate(subject, vars),
    body: renderTemplate(body, vars),
    emailType,
    confirmUrl: vars.confirmUrl ?? vars.confirmation_agence_link ?? "",
    useHtml,
  });
}
