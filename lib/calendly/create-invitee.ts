import { getCalendlyApiToken } from "@/lib/calendly";

const CALENDLY_API = "https://api.calendly.com";
const DEFAULT_INVITEE_TIMEZONE = "Europe/Paris";

export type CreateInviteeParams = {
  eventTypeUri: string;
  startTime: string;
  inviteeEmail: string;
  inviteeName: string;
  timezone?: string;
};

export type CreateInviteeResult = {
  inviteeUri: string;
  eventUri: string;
  startTime: string;
  rescheduleUrl: string;
  cancelUrl: string;
};

export async function createInvitee(
  params: CreateInviteeParams,
): Promise<CreateInviteeResult> {
  const token = getCalendlyApiToken();
  const name = params.inviteeName.trim() || params.inviteeEmail;
  const response = await fetch(`${CALENDLY_API}/invitees`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_type: params.eventTypeUri,
      start_time: params.startTime,
      invitee: {
        name,
        email: params.inviteeEmail.trim().toLowerCase(),
        timezone: params.timezone ?? DEFAULT_INVITEE_TIMEZONE,
      },
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Calendly invitee HTTP ${response.status}: ${body}`);
  }

  const data = JSON.parse(body) as {
    resource?: Record<string, unknown>;
  };
  const resource = data.resource ?? {};
  const inviteeUri = String(resource.uri ?? "").trim();
  const event = (resource.event ?? {}) as Record<string, unknown>;
  const eventUri = String(event.uri ?? resource.event ?? "").trim();
  const rescheduleUrl = String(resource.reschedule_url ?? "").trim();
  const cancelUrl = String(resource.cancel_url ?? "").trim();
  const startTime = String(resource.start_time ?? params.startTime).trim();

  if (!inviteeUri || !rescheduleUrl) {
    throw new Error("Calendly invitee response missing uri or reschedule_url");
  }

  return {
    inviteeUri,
    eventUri,
    startTime,
    rescheduleUrl,
    cancelUrl,
  };
}
