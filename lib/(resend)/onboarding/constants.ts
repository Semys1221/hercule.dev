import type { BookingEmailType } from "@/lib/(resend)/communication/types";

export const PAYMENT_ONBOARDING_SIGNATURE_TAGLINE =
  "Courtage en projet BNC/BIC/TNS";

export const PAYMENT_ONBOARDING_SEQUENCE_SLUG = "payment-onboarding";

export const PAYMENT_ONBOARDING_TRIGGERED_BY = "payment_onboarding_sequence" as const;

export const PAYMENT_ONBOARDING_EMAIL_TYPES = [
  "payment_onboarding_1",
  "payment_onboarding_2",
  "payment_onboarding_3",
  "payment_onboarding_4",
  "payment_onboarding_5",
  "payment_onboarding_6",
  "payment_onboarding_7",
  "payment_onboarding_8",
  "payment_onboarding_9",
] as const satisfies readonly BookingEmailType[];

export type PaymentOnboardingEmailType =
  (typeof PAYMENT_ONBOARDING_EMAIL_TYPES)[number];

export type PaymentOnboardingVertical = "dec" | "cif" | "ias";

export const PAYMENT_ONBOARDING_VERTICALS: PaymentOnboardingVertical[] = [
  "dec",
  "cif",
  "ias",
];

const MS_HOUR = 60 * 60 * 1000;
export const MS_DAY = 24 * MS_HOUR;

/** E2: +2h after payment */
export const PAYMENT_ONBOARDING_E2_OFFSET_MS = 2 * MS_HOUR;

/** Nurture offsets from paymentAt (days) — E4..E9 */
export const PAYMENT_ONBOARDING_NURTURE_DAY_OFFSETS = [3, 6, 9, 12, 15, 20] as const;

export function isPaymentOnboardingEmailType(
  emailType: BookingEmailType,
): boolean {
  return (PAYMENT_ONBOARDING_EMAIL_TYPES as readonly string[]).includes(emailType);
}

export function isPaymentOnboardingSequenceEnabled(): boolean {
  return process.env.PAYMENT_ONBOARDING_SEQUENCE_ENABLED === "1";
}

export function paymentOnboardingMarkdownFile(
  vertical: PaymentOnboardingVertical,
): string {
  return `${vertical}.md`;
}
