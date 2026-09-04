export function getCalendlyBaseUrl(): string {
  return (
    process.env.CALENDLY_BASE_URL?.trim() ||
    "https://calendly.com/contact-henri-fridzi/30min"
  );
}

export function getCalendlyWebhookSigningKey(): string {
  return process.env.CALENDLY_WEBHOOK_SIGNING_KEY?.trim() || "";
}

export function getResendWebhookSecret(): string {
  return process.env.RESEND_WEBHOOK_SECRET?.trim() || "";
}
