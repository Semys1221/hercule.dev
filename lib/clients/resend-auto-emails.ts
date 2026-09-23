/** When false, cron and sequences must not send or schedule Resend emails for this client. */
export const RESEND_AUTO_EMAILS_PROFILE_KEY = "resend_auto_emails_enabled";

export function isClientResendAutoEmailsEnabled(
  profile: Record<string, unknown> | null | undefined,
): boolean {
  return profile?.[RESEND_AUTO_EMAILS_PROFILE_KEY] !== false;
}
