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

/** First email in each sequence uses plain text only; follow-ups use React HTML. */
export function defaultUseHtml(emailType: BookingEmailType): boolean {
  return emailType !== "immediate" && emailType !== "role_seq_48";
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
  useHtml?: boolean;
}): Promise<{ subject: string; text: string; html?: string }> {
  const cleanedBody = stripLegacyClosing(params.body);
  const confirmUrl = params.confirmUrl?.trim() || "";
  const useHtml = params.useHtml ?? defaultUseHtml(params.emailType);

  let textBody = cleanedBody;
  if (textBody.includes("{{confirmLink}}")) {
    textBody = textBody.replace(
      /\{\{confirmLink\}\}/g,
      confirmUrl ? buildConfirmLinkPlainText(confirmUrl) : "consulter",
    );
  }

  if (useHtml) {
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
