import { Link, Text } from "@react-email/components";
import type { ReactNode } from "react";

import { EMAIL_COLORS, EMAIL_FONT_FAMILY } from "./constants";
import { BookingEmailLayout } from "./components/booking-email-layout";

type BookingHtmlEmailProps = {
  bodyText: string;
  confirmUrl?: string;
};

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;
const CONFIRM_LINK_PLACEHOLDER = "{{confirmLink}}";

function renderConfirmLink(confirmUrl: string, key: string) {
  return (
    <Link
      key={key}
      href={confirmUrl}
      style={{
        color: EMAIL_COLORS.link,
        textDecoration: "underline",
      }}
    >
      consulter
    </Link>
  );
}

function renderParagraphText(text: string, confirmUrl?: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;
  let index = 0;

  while (remaining.length > 0) {
    const placeholderIndex = remaining.indexOf(CONFIRM_LINK_PLACEHOLDER);
    if (placeholderIndex !== -1) {
      const before = remaining.slice(0, placeholderIndex);
      if (before) {
        nodes.push(...renderPlainTextSegment(before, index));
        index += before.length;
      }
      if (confirmUrl) {
        nodes.push(renderConfirmLink(confirmUrl, `confirm-${index}`));
      } else {
        nodes.push("consulter");
      }
      remaining = remaining.slice(
        placeholderIndex + CONFIRM_LINK_PLACEHOLDER.length,
      );
      continue;
    }

    nodes.push(...renderPlainTextSegment(remaining, index));
    break;
  }

  return nodes;
}

function renderPlainTextSegment(text: string, startIndex: number): ReactNode[] {
  const parts = text.split(URL_PATTERN).filter((part) => part.length > 0);
  return parts.map((part, offset) => {
    const key = `segment-${startIndex + offset}`;
    if (/^https?:\/\//.test(part)) {
      return (
        <Link
          key={key}
          href={part}
          style={{
            color: EMAIL_COLORS.link,
            textDecoration: "underline",
            wordBreak: "break-all",
          }}
        >
          {part}
        </Link>
      );
    }
    return part;
  });
}

function renderBodyParagraphs(bodyText: string, confirmUrl?: string) {
  const paragraphs = bodyText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs.map((paragraph, index) => (
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
      {renderParagraphText(paragraph.replace(/\n/g, " "), confirmUrl)}
    </Text>
  ));
}

export function BookingHtmlEmail({ bodyText, confirmUrl }: BookingHtmlEmailProps) {
  const preview = bodyText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .find(Boolean)
    ?.replace(/\{\{confirmLink\}\}/g, "consulter")
    ?.slice(0, 120);

  return (
    <BookingEmailLayout preview={preview}>
      {renderBodyParagraphs(bodyText, confirmUrl)}
    </BookingEmailLayout>
  );
}

export default BookingHtmlEmail;
