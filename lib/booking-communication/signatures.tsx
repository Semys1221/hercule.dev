import { render } from "@react-email/render";

import { BookingHtmlEmail } from "@/emails/booking-html-email";
import { buildMeetingActionsPlainText } from "@/emails/components/meeting-actions-line";
import { HERCULE_CONTACT_EMAIL, HERCULE_WEBSITE_URL } from "@/emails/constants";
import type { LeadCategory } from "@/lib/link-tracking/types";

import type { MeetingActionLinks } from "./meeting-links";
import type { BookingEmailType } from "./types";

export const HERCULE_LOGO_URL =
  "https://grzs6rqzvzupoxv9.public.blob.vercel-storage.com/hercule_logo_22kb.png";

export const SIGNATURE_TAGLINES: Record<LeadCategory, string> = {
  agence: "Courtage de projets Web & Tech",
  entreprise: "Mise en relation de projets Web & Tech",
};

export function signatureTagline(category: LeadCategory): string {
  return SIGNATURE_TAGLINES[category];
}

export function buildPlainSignature(category: LeadCategory): string {
  return [
    "Hercule",
    signatureTagline(category),
    `Bordeaux, France | ${HERCULE_WEBSITE_URL}`,
    HERCULE_CONTACT_EMAIL,
  ].join("\n");
}

const PLAIN_TEXT_ONLY: BookingEmailType[] = ["immediate", "role_seq_48"];

/** First email in each sequence uses plain text only; follow-ups use React HTML. */
export function defaultUseHtml(emailType: BookingEmailType): boolean {
  return !PLAIN_TEXT_ONLY.includes(emailType);
}

const LEGACY_CLOSING_PATTERN = /\n*Cordialement,?\s*$/i;

export function stripLegacyClosing(body: string): string {
  return body.replace(LEGACY_CLOSING_PATTERN, "").trimEnd();
}

export function appendPlainSignature(
  body: string,
  category: LeadCategory,
  meetingActionsLine?: string | null,
): string {
  const cleaned = stripLegacyClosing(body);
  const parts = [cleaned];
  if (meetingActionsLine) {
    parts.push("", meetingActionsLine);
  }
  parts.push("", buildPlainSignature(category));
  return parts.join("\n");
}

export function appendHtmlTextFallbackSignature(
  body: string,
  category: LeadCategory = "agence",
): string {
  return appendPlainSignature(body, category);
}

export function buildConfirmLinkPlainText(confirmUrl: string): string {
  return `consulter : ${confirmUrl}`;
}

export function buildConfirmationAgencePlainText(confirmUrl: string): string {
  return `Confirmer ma présence : ${confirmUrl}`;
}

function usesConsulterLinkLabel(
  emailType: BookingEmailType,
  confirmUrl: string,
  body?: string,
): boolean {
  if (emailType === "role_seq_24") {
    return true;
  }
  if (
    emailType === "h48_confirm" &&
    (body?.includes("{{post_booking_link}}") ||
      confirmUrl.includes("post-booking-entreprise"))
  ) {
    return true;
  }
  return false;
}

function confirmButtonLabel(
  emailType: BookingEmailType,
  body?: string,
  confirmUrl?: string,
): string {
  return usesConsulterLinkLabel(emailType, confirmUrl ?? "", body)
    ? "Consulter"
    : "Confirmer ma présence";
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

  const enhancedLine = usesConsulterLinkLabel(emailType, confirmUrl, textBody)
    ? buildConfirmLinkPlainText(confirmUrl)
    : buildConfirmationAgencePlainText(confirmUrl);

  const escapedUrl = confirmUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return textBody.replace(new RegExp(`^${escapedUrl}$`, "m"), enhancedLine);
}

export async function renderBookingHtml(
  bodyText: string,
  category: LeadCategory,
  confirmUrl?: string,
  confirmButtonLabel?: string,
  meetingActionLinks?: MeetingActionLinks,
): Promise<string> {
  return render(
    <BookingHtmlEmail
      bodyText={bodyText}
      category={category}
      confirmUrl={confirmUrl}
      confirmButtonLabel={confirmButtonLabel}
      meetingActionLinks={meetingActionLinks}
    />,
  );
}

export async function finalizeRenderedEmail(params: {
  category: LeadCategory;
  subject: string;
  body: string;
  emailType: BookingEmailType;
  confirmUrl?: string;
  useHtml?: boolean;
  meetingActionLinks?: MeetingActionLinks;
}): Promise<{ subject: string; text: string; html?: string }> {
  const cleanedBody = stripLegacyClosing(params.body);
  const confirmUrl = params.confirmUrl?.trim() || "";
  const useHtml = PLAIN_TEXT_ONLY.includes(params.emailType)
    ? false
    : (params.useHtml ?? defaultUseHtml(params.emailType));
  const meetingActionsLine = params.meetingActionLinks
    ? buildMeetingActionsPlainText(params.meetingActionLinks)
    : null;

  const textBody = enhanceConfirmLinksInText(
    cleanedBody,
    confirmUrl,
    params.emailType,
  );

  if (useHtml) {
    return {
      subject: params.subject,
      text: appendPlainSignature(
        textBody,
        params.category,
        meetingActionsLine,
      ),
      html: await renderBookingHtml(
        cleanedBody,
        params.category,
        confirmUrl || undefined,
        confirmButtonLabel(params.emailType, cleanedBody, confirmUrl || undefined),
        params.meetingActionLinks,
      ),
    };
  }

  return {
    subject: params.subject,
    text: appendPlainSignature(textBody, params.category, meetingActionsLine),
  };
}
