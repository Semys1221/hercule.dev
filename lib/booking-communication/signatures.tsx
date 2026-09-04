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

const PLAIN_TEXT_ONLY: BookingEmailType[] = ["immediate", "role_seq_48"];

/** First email in each sequence uses plain text only; follow-ups use React HTML. */
export function defaultUseHtml(emailType: BookingEmailType): boolean {
  return !PLAIN_TEXT_ONLY.includes(emailType);
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

export function buildConfirmationAgencePlainText(confirmUrl: string): string {
  return `Confirmer ma présence : ${confirmUrl}`;
}

function confirmButtonLabel(emailType: BookingEmailType): string {
  return emailType === "role_seq_24" ? "Consulter" : "Confirmer ma présence";
}

function enhanceConfirmLinksInText(
  textBody: string,
  confirmUrl: string,
  emailType: BookingEmailType,
): string {
  if (!confirmUrl) {
    return textBody;
  }

  if (textBody.includes("{{confirmLink}}")) {
    return textBody.replace(
      /\{\{confirmLink\}\}/g,
      buildConfirmLinkPlainText(confirmUrl),
    );
  }

  const enhancedLine =
    emailType === "role_seq_24"
      ? buildConfirmLinkPlainText(confirmUrl)
      : buildConfirmationAgencePlainText(confirmUrl);

  const escapedUrl = confirmUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return textBody.replace(new RegExp(`^${escapedUrl}$`, "m"), enhancedLine);
}

export async function renderBookingHtml(
  bodyText: string,
  confirmUrl?: string,
  confirmButtonLabel?: string,
): Promise<string> {
  return render(
    <BookingHtmlEmail
      bodyText={bodyText}
      confirmUrl={confirmUrl}
      confirmButtonLabel={confirmButtonLabel}
    />,
  );
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
  const useHtml = PLAIN_TEXT_ONLY.includes(params.emailType)
    ? false
    : (params.useHtml ?? defaultUseHtml(params.emailType));

  const textBody = enhanceConfirmLinksInText(
    cleanedBody,
    confirmUrl,
    params.emailType,
  );

  if (useHtml) {
    return {
      subject: params.subject,
      text: appendPlainSignature(textBody),
      html: await renderBookingHtml(
        cleanedBody,
        confirmUrl || undefined,
        confirmButtonLabel(params.emailType),
      ),
    };
  }

  return {
    subject: params.subject,
    text: appendPlainSignature(textBody),
  };
}
