import type { BypassConfig } from "./types";

/** Fallback when `instantly_bypass_config.e1_webhook_delay_ms` is unset. */
export const E1_WEBHOOK_DEFAULT_DELAY_MS = 0;

export const RESTAURANT_DCE_E1_WEBHOOK_DELAY_MS = 5 * 60 * 1000;

export function resolveE1WebhookDelayMs(config: BypassConfig | null): number {
  const fromConfig = config?.e1_webhook_delay_ms;
  if (typeof fromConfig === "number" && Number.isFinite(fromConfig) && fromConfig >= 0) {
    return fromConfig;
  }
  return E1_WEBHOOK_DEFAULT_DELAY_MS;
}

export function e1WebhookScheduledFor(
  from = new Date(),
  delayMs = E1_WEBHOOK_DEFAULT_DELAY_MS,
): Date {
  return new Date(from.getTime() + delayMs);
}

export function shouldBypassSendWindow(
  payload: Record<string, unknown> | null | undefined,
): boolean {
  return payload?.bypass_send_window === true;
}
