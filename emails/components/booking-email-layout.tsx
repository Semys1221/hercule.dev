import {
  Body,
  Container,
  Head,
  Html,
  Preview,
} from "@react-email/components";
import type { ReactNode } from "react";

import { EMAIL_COLORS, EMAIL_FONT_FAMILY } from "../constants";
import { EmailSignature } from "./email-signature";
import { MeetingActionsLine } from "./meeting-actions-line";
import type { MeetingActionLinks } from "@/lib/booking-communication/meeting-links";

type BookingEmailLayoutProps = {
  preview?: string;
  children: ReactNode;
  signatureTagline: string;
  meetingActionLinks?: MeetingActionLinks;
};

export function BookingEmailLayout({
  preview,
  children,
  signatureTagline,
  meetingActionLinks,
}: BookingEmailLayoutProps) {
  return (
    <Html lang="fr">
      <Head />
      {preview ? <Preview>{preview}</Preview> : null}
      <Body
        style={{
          margin: 0,
          padding: "16px 12px",
          backgroundColor: EMAIL_COLORS.background,
          fontFamily: EMAIL_FONT_FAMILY,
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            padding: "8px 4px",
          }}
        >
          {children}
          {meetingActionLinks ? (
            <MeetingActionsLine links={meetingActionLinks} />
          ) : null}
          <EmailSignature tagline={signatureTagline} />
        </Container>
      </Body>
    </Html>
  );
}
