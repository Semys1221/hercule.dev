/**
 * Resend package — conference/clients sequences + shared send spine.
 * Niche sequences still live under `lib/legacy/*` and import via shims.
 */

export { getResendClient } from "./client";
export type {
  SendEmailFailure,
  SendEmailResult,
  SendEmailSuccess,
} from "./client";

export { sendBookingEmail } from "./communication/send";
export {
  isPaymentOnboardingSequenceEnabled,
  startPaymentOnboardingSequence,
} from "./onboarding";
export { scheduleConferenceEmailSequence } from "./conference/post-payment";
export { listResendBookingSequences, getResendSequence } from "./sequences/registry";
export { NOTIFICATION_CATALOG } from "./notifications/catalog";
