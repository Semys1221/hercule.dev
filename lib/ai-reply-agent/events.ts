/** Instantly webhook event types handled by the AI Reply Agent. */

/** Valid when registering a webhook via POST /webhooks */
export const REPLY_WEBHOOK_EVENT = "reply_received";
export const OOO_WEBHOOK_EVENT = "lead_out_of_office";

/** Payload event_type values we accept at runtime (API subscribe vs delivery can differ). */
export const HANDLED_REPLY_EVENTS = new Set([REPLY_WEBHOOK_EVENT]);

export const HANDLED_OOO_EVENTS = new Set([
  OOO_WEBHOOK_EVENT,
  "auto_reply_received",
]);

export const HANDLED_REPLY_AGENT_EVENTS = new Set([
  ...HANDLED_REPLY_EVENTS,
  ...HANDLED_OOO_EVENTS,
]);

export function isOooReplyEvent(eventType: string): boolean {
  return HANDLED_OOO_EVENTS.has(eventType);
}

export function isHandledReplyAgentEvent(eventType: string): boolean {
  return HANDLED_REPLY_AGENT_EVENTS.has(eventType);
}
