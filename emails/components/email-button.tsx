import { Link } from "@react-email/components";

import { EMAIL_COLORS, EMAIL_FONT_FAMILY } from "../constants";

type EmailButtonProps = {
  href: string;
  label: string;
};

export function EmailButton({ href, label }: EmailButtonProps) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        marginTop: "12px",
        marginBottom: "4px",
        padding: "8px 16px",
        backgroundColor: EMAIL_COLORS.ctaBackground,
        color: EMAIL_COLORS.ctaText,
        fontFamily: EMAIL_FONT_FAMILY,
        fontSize: "14px",
        fontWeight: 500,
        lineHeight: "1.4",
        textDecoration: "none",
        borderRadius: EMAIL_COLORS.ctaBorderRadius,
      }}
    >
      {label}
    </Link>
  );
}
