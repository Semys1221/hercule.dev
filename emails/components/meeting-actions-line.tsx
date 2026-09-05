import { Link, Text } from "@react-email/components";

import { EMAIL_COLORS, EMAIL_FONT_FAMILY } from "../constants";
import type { MeetingActionLinks } from "@/lib/booking-communication/meeting-links";

const LINE_STYLE = {
  margin: "24px 0 0",
  fontFamily: EMAIL_FONT_FAMILY,
  fontSize: "14px",
  lineHeight: "1.6",
  color: EMAIL_COLORS.muted,
};

const LINK_STYLE = {
  color: EMAIL_COLORS.accent,
  textDecoration: "underline",
};

type Segment = {
  label: string;
  url: string;
};

function meetingActionSegments(links: MeetingActionLinks): Segment[] {
  const segments: Segment[] = [];
  if (links.joinUrl) {
    segments.push({ label: "Rejoindre la réunion", url: links.joinUrl });
  }
  if (links.rescheduleUrl) {
    segments.push({
      label: "Replanifier la réunion",
      url: links.rescheduleUrl,
    });
  }
  if (links.cancelUrl) {
    segments.push({ label: "Annuler la réunion", url: links.cancelUrl });
  }
  return segments;
}

export function buildMeetingActionsPlainText(
  links: MeetingActionLinks,
): string | null {
  const segments = meetingActionSegments(links);
  if (segments.length === 0) {
    return null;
  }

  return segments
    .map((segment) => `${segment.label} : ${segment.url}`)
    .join(" | ");
}

export function MeetingActionsLine({ links }: { links: MeetingActionLinks }) {
  const segments = meetingActionSegments(links);
  if (segments.length === 0) {
    return null;
  }

  return (
    <Text style={LINE_STYLE}>
      {segments.map((segment, index) => (
        <span key={segment.label}>
          {index > 0 ? " | " : null}
          {segment.label} :{" "}
          <Link href={segment.url} style={LINK_STYLE}>
            {segment.url}
          </Link>
        </span>
      ))}
    </Text>
  );
}
