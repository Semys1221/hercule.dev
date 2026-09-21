import { getCalendlyApiToken } from "@/lib/legacy/calendly";

const CALENDLY_API = "https://api.calendly.com";

export type CreateSingleUseSchedulingLinkParams = {
  eventTypeUri: string;
  maxEventCount?: number;
};

export type CreateSingleUseSchedulingLinkResult = {
  bookingUrl: string;
  owner: string;
};

export async function createSingleUseSchedulingLink(
  params: CreateSingleUseSchedulingLinkParams,
): Promise<CreateSingleUseSchedulingLinkResult> {
  const token = getCalendlyApiToken();
  const eventTypeUri = params.eventTypeUri.trim();
  if (!eventTypeUri) {
    throw new Error("eventTypeUri is required");
  }

  const response = await fetch(`${CALENDLY_API}/scheduling_links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      max_event_count: params.maxEventCount ?? 1,
      owner: eventTypeUri,
      owner_type: "EventType",
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Calendly scheduling_links HTTP ${response.status}: ${body}`);
  }

  const data = JSON.parse(body) as {
    resource?: {
      booking_url?: string;
      owner?: string;
    };
  };
  const bookingUrl = String(data.resource?.booking_url ?? "").trim();
  const owner = String(data.resource?.owner ?? eventTypeUri).trim();

  if (!bookingUrl) {
    throw new Error("Calendly scheduling_links response missing booking_url");
  }

  return { bookingUrl, owner };
}
