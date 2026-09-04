/** Shared secret for Instantly → Hercule webhook Authorization header. */
export function webhookSecret(): string {
  return (
    process.env.INSTANTLY_BYPASS_WEBHOOK_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    ""
  );
}

export function isInstantlyWebhookAuthorized(request: Request): boolean {
  const expected = webhookSecret();
  if (!expected) {
    return true;
  }
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${expected}`) return true;
  return request.headers.get("x-instantly-bypass-secret") === expected;
}
