export const E1_WEBHOOK_HUMAN_DELAY_MS = 15 * 60 * 1000;

export function e1WebhookScheduledFor(from = new Date()): Date {
  return new Date(from.getTime() + E1_WEBHOOK_HUMAN_DELAY_MS);
}

export function shouldBypassSendWindow(
  payload: Record<string, unknown> | null | undefined,
): boolean {
  return payload?.bypass_send_window === true;
}
