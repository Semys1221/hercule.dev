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

function normalizeInboundProbe(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Calendly notification emails (booking created/canceled, invite accepted). */
export function isCalendlySystemEmail(text: string): boolean {
  const probe = normalizeInboundProbe(text);
  if (!probe || probe === "(empty body)") {
    return false;
  }

  if (!probe.includes("calendly")) {
    return (
      probe.includes("accepted your invitation") ||
      probe.includes("a accepté votre invitation")
    );
  }

  return (
    probe.includes("a new event has been scheduled") ||
    probe.includes("the event below has been canceled") ||
    probe.includes("accepted your invitation") ||
    probe.includes("a accepté votre invitation") ||
    probe.includes("nouvel événement") ||
    probe.includes("nouvel evenement") ||
    (probe.includes("hi hercule") && probe.includes("event type"))
  );
}

/** Captcha challenges and non-delivery bounces — not a prospect reply. */
export function isCaptchaOrBounceEmail(text: string): boolean {
  const probe = normalizeInboundProbe(text);
  if (!probe || probe === "(empty body)") {
    return false;
  }

  return (
    probe.includes("captcha") ||
    probe.includes("non-délivrance") ||
    probe.includes("non-delivrance") ||
    probe.includes("message could not be delivered") ||
    probe.includes("delivery status notification")
  );
}
