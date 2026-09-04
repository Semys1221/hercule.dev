import { Text } from "@react-email/components";
import type { ReactNode } from "react";

import { EMAIL_COLORS, EMAIL_FONT_FAMILY } from "./constants";
import { BookingEmailLayout } from "./components/booking-email-layout";
import { EmailButton } from "./components/email-button";

type BookingHtmlEmailProps = {
  bodyText: string;
  confirmUrl?: string;
  confirmButtonLabel?: string;
};

const CONFIRM_MARKERS = [
  "{{confirmation_agence_link}}",
  "{{confirmLink}}",
  "{{confirmUrl}}",
] as const;

const PLAIN_BODY_STYLE = {
  margin: 0,
  fontFamily: EMAIL_FONT_FAMILY,
  fontSize: "15px",
  lineHeight: "1.6",
  color: EMAIL_COLORS.text,
  whiteSpace: "pre-wrap" as const,
};

function markerButtonLabel(marker: string, fallback: string): string {
  if (marker === "{{confirmLink}}") {
    return "Consulter";
  }
  return fallback;
}

function splitBodyAtConfirm(
  bodyText: string,
  confirmUrl?: string,
  confirmButtonLabel = "Confirmer ma présence",
): { before: string; after: string; label: string } | null {
  for (const marker of CONFIRM_MARKERS) {
    const index = bodyText.indexOf(marker);
    if (index === -1) {
      continue;
    }
    return {
      before: bodyText.slice(0, index),
      after: bodyText.slice(index + marker.length),
      label: markerButtonLabel(marker, confirmButtonLabel),
    };
  }

  if (!confirmUrl) {
    return null;
  }

  const index = bodyText.indexOf(confirmUrl);
  if (index === -1) {
    return null;
  }

  return {
    before: bodyText.slice(0, index),
    after: bodyText.slice(index + confirmUrl.length),
    label: confirmButtonLabel,
  };
}

function renderPlainBody(
  bodyText: string,
  confirmUrl?: string,
  confirmButtonLabel = "Confirmer ma présence",
): ReactNode {
  const split = splitBodyAtConfirm(bodyText, confirmUrl, confirmButtonLabel);

  if (!split || !confirmUrl) {
    return <Text style={PLAIN_BODY_STYLE}>{bodyText}</Text>;
  }

  return (
    <>
      {split.before ? <Text style={PLAIN_BODY_STYLE}>{split.before}</Text> : null}
      <EmailButton href={confirmUrl} label={split.label} />
      {split.after ? (
        <Text style={{ ...PLAIN_BODY_STYLE, marginTop: "16px" }}>{split.after}</Text>
      ) : null}
    </>
  );
}

export function BookingHtmlEmail({
  bodyText,
  confirmUrl,
  confirmButtonLabel = "Confirmer ma présence",
}: BookingHtmlEmailProps) {
  const preview = bodyText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .find(Boolean)
    ?.replace(/\{\{confirmLink\}\}/g, "Consulter")
    ?.replace(/\{\{confirmation_agence_link\}\}/g, "Confirmer")
    ?.slice(0, 120);

  return (
    <BookingEmailLayout preview={preview}>
      {renderPlainBody(bodyText, confirmUrl, confirmButtonLabel)}
    </BookingEmailLayout>
  );
}

export default BookingHtmlEmail;
