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

export function getStripeSecretKey(): string {
  return process.env.STRIPE_SECRET_KEY?.trim() || "";
}

export function getStripeWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || "";
}

export function getNotificationOpsEmail(): string {
  return process.env.NOTIFICATION_OPS_EMAIL?.trim() || "";
}

export function getStripeStarterPriceId(): string {
  return (
    process.env.STRIPE_PRICE_STARTER?.trim() ||
    process.env.STRIPE_PRICE_MONTHLY_1489?.trim() ||
    ""
  );
}

/**
 * Calendly event type URI for delivery (match) meetings.
 * If set, the webhook uses it as an additional guard.
 * Set via CALENDLY_DELIVERY_EVENT_TYPE_URI env var.
 */
export function getCalendlyDeliveryEventTypeUri(): string {
  return process.env.CALENDLY_DELIVERY_EVENT_TYPE_URI?.trim() || "";
}
