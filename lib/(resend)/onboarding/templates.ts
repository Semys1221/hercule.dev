import type { LeadCategory } from "@/lib/legacy/link-tracking/types";
import type { BookingEmailType } from "@/lib/legacy/booking-communication/types";

import type { PaymentOnboardingVertical } from "./constants";
import { isPaymentOnboardingEmailType } from "./constants";
import { readPaymentOnboardingSequence } from "./sequences";

function verticalForCategory(
  category: LeadCategory,
  verticalOverride?: PaymentOnboardingVertical | null,
): PaymentOnboardingVertical | null {
  if (verticalOverride) {
    return verticalOverride;
  }
  if (category === "comptable") return "dec";
  if (category === "cif") return "cif";
  if (category === "entreprise") return "ias";
  return null;
}

export function paymentOnboardingDefaultTemplate(
  category: LeadCategory,
  emailType: BookingEmailType,
  verticalOverride?: PaymentOnboardingVertical | null,
): { subject: string; body: string } | null {
  if (!isPaymentOnboardingEmailType(emailType)) {
    return null;
  }
  const vertical = verticalForCategory(category, verticalOverride);
  if (!vertical) {
    return null;
  }
  const doc = readPaymentOnboardingSequence(vertical);
  const step = doc.steps.find((item) => item.emailType === emailType);
  if (!step) {
    return null;
  }
  return { subject: step.subject, body: step.body };
}

export function listPaymentOnboardingTemplatesForVertical(
  vertical: PaymentOnboardingVertical,
): Array<{ emailType: string; subject: string; body: string }> {
  const doc = readPaymentOnboardingSequence(vertical);
  return doc.steps.map((step) => ({
    emailType: step.emailType,
    subject: step.subject,
    body: step.body,
  }));
}
