/** Production webhook auto-send is opt-in until explicitly enabled. */
export function isWebhookBypassEnabled(): boolean {
  return process.env.INSTANTLY_BYPASS_WEBHOOK_ENABLED?.trim() === "true";
}
