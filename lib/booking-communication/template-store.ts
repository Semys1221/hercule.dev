import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { LeadCategory } from "@/lib/link-tracking/types";

import {
  buildFirstNameLine,
  DEFAULT_BOOKING_EMAIL_TEMPLATES,
  formatMeetingDateTime,
  renderTemplate,
} from "./templates";
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

export async function renderEmailFromStore(params: {
  category: LeadCategory;
  emailType: BookingEmailType;
  firstName: string | null;
  scheduledAt: string | null;
  confirmUrl: string;
}): Promise<RenderedBookingEmail> {
  const templates = await getBookingEmailTemplates(params.category);
  const template = templates.find((row) => row.email_type === params.emailType);
  if (!template) {
    throw new Error(`missing_template:${params.emailType}`);
  }

  const { date, heure } = formatMeetingDateTime(params.scheduledAt);
  const vars: Record<string, string> = {
    firstNameLine: buildFirstNameLine(params.firstName, params.emailType),
    date,
    heure,
    confirmUrl: params.confirmUrl,
  };

  return {
    subject: renderTemplate(template.subject, vars),
    text: renderTemplate(template.body, vars),
  };
}

/** Client-side preview helper (no DB fetch). */
export function previewTemplate(
  subject: string,
  body: string,
  emailType: BookingEmailType,
): RenderedBookingEmail {
  const sampleScheduledAt = "2026-09-10T09:00:00+02:00";
  const { date, heure } = formatMeetingDateTime(sampleScheduledAt);
  const vars: Record<string, string> = {
    firstNameLine: buildFirstNameLine("Jean", emailType),
    date,
    heure,
    confirmUrl:
      "https://www.hercule.dev/confirm-reservation.html?code=exemple-slug&email=jean@example.com",
  };
  if (emailType === "immediate") {
    delete vars.confirmUrl;
  }
  return {
    subject: renderTemplate(subject, vars),
    text: renderTemplate(body, vars),
  };
}
