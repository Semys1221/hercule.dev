import { render } from "@react-email/render";

import { BookingHtmlEmail } from "@/emails/booking-html-email";
import { HERCULE_CONTACT_EMAIL, HERCULE_WEBSITE_URL } from "@/emails/constants";

import type { BookingEmailType } from "./types";

export const HERCULE_LOGO_URL =
  "https://grzs6rqzvzupoxv9.public.blob.vercel-storage.com/hercule_logo_22kb.png";

export const PLAIN_SIGNATURE = [
  "Hercule",
  "Courtage de projets Web & Tech",
  `Bordeaux, France | ${HERCULE_WEBSITE_URL}`,
  HERCULE_CONTACT_EMAIL,
].join("\n");

export const HTML_EMAIL_TYPES = [
  "h48_confirm",
  "h24_relance",
  "role_seq_48",
  "role_seq_24",
] as const;

export type HtmlBookingEmailType = (typeof HTML_EMAIL_TYPES)[number];

export function isHtmlBookingEmailType(
  emailType: BookingEmailType,
): emailType is HtmlBookingEmailType {
  return (HTML_EMAIL_TYPES as readonly BookingEmailType[]).includes(emailType);
}

const LEGACY_CLOSING_PATTERN = /\n*Cordialement,?\s*$/i;

export function stripLegacyClosing(body: string): string {
  return body.replace(LEGACY_CLOSING_PATTERN, "").trimEnd();
}

export function appendPlainSignature(body: string): string {
  const cleaned = stripLegacyClosing(body);
  return `${cleaned}\n\n${PLAIN_SIGNATURE}`;
}

export function appendHtmlTextFallbackSignature(body: string): string {
  return appendPlainSignature(body);
}

export function buildConfirmLinkPlainText(confirmUrl: string): string {
  return `consulter : ${confirmUrl}`;
}

export async function renderBookingHtml(
  bodyText: string,
  confirmUrl?: string,
): Promise<string> {
  return render(<BookingHtmlEmail bodyText={bodyText} confirmUrl={confirmUrl} />);
}

export async function finalizeRenderedEmail(params: {
  subject: string;
  body: string;
  emailType: BookingEmailType;
  confirmUrl?: string;
}): Promise<{ subject: string; text: string; html?: string }> {
  const cleanedBody = stripLegacyClosing(params.body);
  const confirmUrl = params.confirmUrl?.trim() || "";

  let textBody = cleanedBody;
  if (textBody.includes("{{confirmLink}}")) {
    textBody = textBody.replace(
      /\{\{confirmLink\}\}/g,
      confirmUrl ? buildConfirmLinkPlainText(confirmUrl) : "consulter",
    );
  }

  if (isHtmlBookingEmailType(params.emailType)) {
    return {
      subject: params.subject,
      text: appendPlainSignature(textBody),
      html: await renderBookingHtml(cleanedBody, confirmUrl || undefined),
    };
  }

  return {
    subject: params.subject,
    text: appendPlainSignature(textBody),
  };
}
