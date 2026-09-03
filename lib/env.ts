export function getCalendlyBaseUrl(): string {
  return (
    process.env.CALENDLY_BASE_URL?.trim() ||
    "https://calendly.com/contact-henri-fridzi/30min"
  );
}

export function getCalendlyWebhookSigningKey(): string {
  return process.env.CALENDLY_WEBHOOK_SIGNING_KEY?.trim() || "";
}
