import { Text } from "@react-email/components";
import type { ReactNode } from "react";

import { EMAIL_COLORS, EMAIL_FONT_FAMILY } from "./constants";
import { BookingEmailLayout } from "./components/booking-email-layout";
import { EmailButton } from "./components/email-button";

type BookingHtmlEmailProps = {
  bodyText: string;
  confirmUrl?: string;
};

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;
const CONFIRM_LINK_PLACEHOLDER = "{{confirmLink}}";
const CONFIRMATION_LINK_PLACEHOLDER = "{{confirmation_agence_link}}";

function renderConfirmButton(confirmUrl: string, key: string, label: string) {
  return <EmailButton key={key} href={confirmUrl} label={label} />;
}

function renderParagraphText(text: string, confirmUrl?: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;
  let index = 0;

  while (remaining.length > 0) {
    const confirmLinkIndex = remaining.indexOf(CONFIRM_LINK_PLACEHOLDER);
    if (confirmLinkIndex !== -1) {
      const before = remaining.slice(0, confirmLinkIndex);
      if (before.trim()) {
        nodes.push(...renderPlainTextSegment(before, index, confirmUrl));
        index += before.length;
      }
      if (confirmUrl) {
        nodes.push(renderConfirmButton(confirmUrl, `confirm-${index}`, "Consulter"));
      } else {
        nodes.push("consulter");
      }
      remaining = remaining.slice(
        confirmLinkIndex + CONFIRM_LINK_PLACEHOLDER.length,
      );
      continue;
    }

    const confirmationLinkIndex = remaining.indexOf(CONFIRMATION_LINK_PLACEHOLDER);
    if (confirmationLinkIndex !== -1) {
      const before = remaining.slice(0, confirmationLinkIndex);
      if (before.trim()) {
        nodes.push(...renderPlainTextSegment(before, index, confirmUrl));
        index += before.length;
      }
      if (confirmUrl) {
        nodes.push(
          renderConfirmButton(
            confirmUrl,
            `confirmation-${index}`,
            "Confirmer ma présence",
          ),
        );
      }
      remaining = remaining.slice(
        confirmationLinkIndex + CONFIRMATION_LINK_PLACEHOLDER.length,
      );
      continue;
    }

    nodes.push(...renderPlainTextSegment(remaining, index, confirmUrl));
    break;
  }

  return nodes;
}

function renderPlainTextSegment(
  text: string,
  startIndex: number,
  confirmUrl?: string,
): ReactNode[] {
  const parts = text.split(URL_PATTERN).filter((part) => part.length > 0);
  return parts.map((part, offset) => {
    const key = `segment-${startIndex + offset}`;
    if (/^https?:\/\//.test(part)) {
      const label =
        confirmUrl && part === confirmUrl
          ? "Confirmer ma présence"
          : "Ouvrir le lien";
      return <EmailButton key={key} href={part} label={label} />;
    }
    return part;
  });
}

function renderBodyParagraphs(bodyText: string, confirmUrl?: string) {
  const paragraphs = bodyText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs.map((paragraph, index) => {
    const normalized = paragraph.replace(/\n/g, " ");
    const isStandaloneConfirmUrl =
      confirmUrl &&
      (normalized === confirmUrl ||
        normalized === CONFIRMATION_LINK_PLACEHOLDER ||
        normalized === "{{confirmUrl}}");

    if (isStandaloneConfirmUrl) {
      return (
        <Text
          key={`paragraph-${index}`}
          style={{
            margin: "0 0 16px",
            fontFamily: EMAIL_FONT_FAMILY,
            fontSize: "15px",
            lineHeight: "1.6",
            color: EMAIL_COLORS.text,
          }}
        >
          {renderConfirmButton(confirmUrl, `standalone-${index}`, "Confirmer ma présence")}
        </Text>
      );
    }

    return (
      <Text
        key={`paragraph-${index}`}
        style={{
          margin: "0 0 16px",
          fontFamily: EMAIL_FONT_FAMILY,
          fontSize: "15px",
          lineHeight: "1.6",
          color: EMAIL_COLORS.text,
          whiteSpace: "pre-wrap",
        }}
      >
        {renderParagraphText(normalized, confirmUrl)}
      </Text>
    );
  });
}

export function BookingHtmlEmail({ bodyText, confirmUrl }: BookingHtmlEmailProps) {
  const preview = bodyText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .find(Boolean)
    ?.replace(/\{\{confirmLink\}\}/g, "Consulter")
    ?.replace(/\{\{confirmation_agence_link\}\}/g, "Confirmer")
    ?.slice(0, 120);

  return (
    <BookingEmailLayout preview={preview}>
      {renderBodyParagraphs(bodyText, confirmUrl)}
    </BookingEmailLayout>
  );
}

export default BookingHtmlEmail;
