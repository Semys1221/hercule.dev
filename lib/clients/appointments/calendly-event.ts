import { getCalendlyApiToken } from "@/lib/legacy/calendly";

import {
  eventTypeUriFromScheduled,
  hostEmailsFromScheduledEvent,
} from "./format";

export async function fetchScheduledEventResource(
  eventUuid: string,
): Promise<Record<string, unknown> | null> {
  if (!eventUuid) return null;
  const token = getCalendlyApiToken();
  const response = await fetch(
    `https://api.calendly.com/scheduled_events/${eventUuid}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as {
    resource?: Record<string, unknown>;
  };
  return data.resource ?? null;
}

export async function resolveHostEmailsAndEventType(params: {
  scheduled: Record<string, unknown> | null;
  eventUuid: string;
}): Promise<{ hostEmails: string[]; eventTypeUri: string | null }> {
  let hostEmails = hostEmailsFromScheduledEvent(params.scheduled);
  let eventTypeUri = eventTypeUriFromScheduled(params.scheduled);
  if (hostEmails.length > 0 && eventTypeUri) {
    return { hostEmails, eventTypeUri };
  }
  const resource = await fetchScheduledEventResource(params.eventUuid);
  if (resource) {
    if (hostEmails.length === 0) {
      hostEmails = hostEmailsFromScheduledEvent(resource);
    }
    if (!eventTypeUri) {
      eventTypeUri = eventTypeUriFromScheduled(resource);
    }
  }
  return { hostEmails, eventTypeUri };
}
