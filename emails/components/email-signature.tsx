import { Column, Img, Link, Row, Section, Text } from "@react-email/components";

import {
  EMAIL_COLORS,
  EMAIL_FONT_FAMILY,
  HERCULE_CONTACT_EMAIL,
  HERCULE_LOGO_URL,
  HERCULE_WEBSITE_URL,
} from "../constants";

export function EmailSignature() {
  return (
    <Section style={{ marginTop: "32px" }}>
      <Row>
        <Column style={{ width: "56px", verticalAlign: "middle" }}>
          <Img
            src={HERCULE_LOGO_URL}
            width={48}
            height={48}
            alt="Hercule"
            style={{ display: "block", borderRadius: "9999px" }}
          />
        </Column>
        <Column style={{ verticalAlign: "middle", paddingLeft: "12px" }}>
          <Text
            style={{
              margin: "0 0 2px",
              fontFamily: EMAIL_FONT_FAMILY,
              fontSize: "15px",
              fontWeight: 600,
              lineHeight: "1.4",
              color: EMAIL_COLORS.text,
            }}
          >
            Hercule
          </Text>
          <Text
            style={{
              margin: "0 0 2px",
              fontFamily: EMAIL_FONT_FAMILY,
              fontSize: "15px",
              fontStyle: "italic",
              lineHeight: "1.4",
              color: EMAIL_COLORS.muted,
            }}
          >
            Courtage de projets Web &amp; Tech
          </Text>
          <Text
            style={{
              margin: "0 0 2px",
              fontFamily: EMAIL_FONT_FAMILY,
              fontSize: "15px",
              lineHeight: "1.4",
              color: EMAIL_COLORS.muted,
            }}
          >
            Bordeaux, France |{" "}
            <Link
              href={HERCULE_WEBSITE_URL}
              style={{
                color: EMAIL_COLORS.accent,
                textDecoration: "underline",
              }}
            >
              hercule.dev
            </Link>
          </Text>
          <Text
            style={{
              margin: 0,
              fontFamily: EMAIL_FONT_FAMILY,
              fontSize: "15px",
              lineHeight: "1.4",
              color: EMAIL_COLORS.muted,
            }}
          >
            {HERCULE_CONTACT_EMAIL}
          </Text>
        </Column>
      </Row>
    </Section>
  );
}
