/**
 * Apply Resend sandbox sender for local E2E (import before other app code in smoke scripts).
 */
import { E2E_RESEND_FROM } from "@/lib/test/e2e-identity";

export function applyE2eResendFromEnv(): void {
  process.env.BOOKING_RESEND_FROM = E2E_RESEND_FROM;
  process.env.RESEND_FROM = E2E_RESEND_FROM;
}
