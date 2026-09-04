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

type BookingEmailLayoutProps = {
  preview?: string;
  children: ReactNode;
};

export function BookingEmailLayout({
  preview,
  children,
}: BookingEmailLayoutProps) {
  return (
    <Html lang="fr">
      <Head />
      {preview ? <Preview>{preview}</Preview> : null}
      <Body
        style={{
          margin: 0,
          padding: "24px 16px",
          backgroundColor: EMAIL_COLORS.background,
          fontFamily: EMAIL_FONT_FAMILY,
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            border: `1px solid ${EMAIL_COLORS.border}`,
            padding: "32px 24px",
          }}
        >
          {children}
          <EmailSignature />
        </Container>
      </Body>
    </Html>
  );
}
