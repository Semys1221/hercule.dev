import crypto from "crypto";

export const CALENDLY_REPLAY_TOLERANCE_SEC = 180;

export type CalendlyQuestionAnswer = {
  question: string;
  answer: string;
};

export type ParsedCalendlyInvitee = {
  inviteeUri: string;
  inviteeUuid: string;
  email: string;
  name: string;
  eventUuid: string;
  utmContent: string;
  startTime: string;
  questionsAndAnswers: CalendlyQuestionAnswer[];
};

export function verifyCalendlySignature(
  rawBody: string,
  header: string | null,
  signingKey: string,
): boolean {
  if (!rawBody || !header || !signingKey) return false;

  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const idx = part.indexOf("=");
      if (idx === -1) return [part.trim(), ""];
      return [part.slice(0, idx).trim(), part.slice(idx + 1).trim()];
    }),
  );

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > CALENDLY_REPLAY_TOLERANCE_SEC) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", signingKey)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function extractUuidFromCalendlyUri(uri: string): string {
  const trimmed = uri.trim().replace(/\/$/, "");
  const parts = trimmed.split("/");
  return parts[parts.length - 1] || "";
}

export function parseEventAndInviteeUuids(
  inviteeUri: string,
): { eventUuid: string; inviteeUuid: string } | null {
  const trimmed = inviteeUri.trim().replace(/\/$/, "");
  const parts = trimmed.split("/");
  const inviteesIdx = parts.lastIndexOf("invitees");
  if (inviteesIdx === -1 || inviteesIdx < 1) return null;

  const eventUuid = parts[inviteesIdx - 1] || "";
  const inviteeUuid = parts[inviteesIdx + 1] || "";
  if (!eventUuid || !inviteeUuid) return null;

  return { eventUuid, inviteeUuid };
}

export type ScheduledEventInviteeLinks = {
  cancelUrl: string;
  rescheduleUrl: string;
  startTime: string | null;
  status: string;
};

export async function getScheduledEventInvitee(
  eventUuid: string,
  inviteeUuid: string,
): Promise<ScheduledEventInviteeLinks> {
  const token = getCalendlyApiToken();
  const response = await fetch(
    `https://api.calendly.com/scheduled_events/${eventUuid}/invitees/${inviteeUuid}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Calendly invitee HTTP ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    resource?: Record<string, unknown>;
  };
  const resource = data.resource ?? {};
  const cancelUrl = String(resource.cancel_url ?? "").trim();
  const rescheduleUrl = String(resource.reschedule_url ?? "").trim();
  const status = String(resource.status ?? "").trim();

  if (!cancelUrl || !rescheduleUrl) {
    throw new Error("Calendly invitee response missing cancel or reschedule URL");
  }

  let startTime: string | null = null;
  const eventResponse = await fetch(
    `https://api.calendly.com/scheduled_events/${eventUuid}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (eventResponse.ok) {
    const eventData = (await eventResponse.json()) as {
      resource?: Record<string, unknown>;
    };
    const eventStart = String(eventData.resource?.start_time ?? "").trim();
    startTime = eventStart || null;
  }

  return { cancelUrl, rescheduleUrl, startTime, status };
}

export function parseInviteeCreatedPayload(
  payload: unknown,
): ParsedCalendlyInvitee | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as { event?: string; payload?: Record<string, unknown> };
  if (body.event !== "invitee.created") return null;

  const invitee = (body.payload ?? {}) as Record<string, unknown>;
  const tracking = (invitee.tracking ?? {}) as Record<string, string>;
  const scheduled = (invitee.scheduled_event ?? {}) as Record<string, string>;

  const inviteeUri = String(invitee.uri ?? "");
  const scheduledUri = String(scheduled.uri ?? "");
  const email = String(invitee.email ?? "").trim().toLowerCase();
  if (!email) return null;

  const rawQA = invitee.questions_and_answers;
  const questionsAndAnswers: Array<{ question: string; answer: string }> = [];
  if (Array.isArray(rawQA)) {
    for (const item of rawQA) {
      if (
        item &&
        typeof item === "object" &&
        "question" in item &&
        "answer" in item
      ) {
        questionsAndAnswers.push({
          question: String((item as Record<string, unknown>).question ?? ""),
          answer: String((item as Record<string, unknown>).answer ?? ""),
        });
      }
    }
  }

  return {
    inviteeUri,
    inviteeUuid: extractUuidFromCalendlyUri(inviteeUri),
    email,
    name: String(invitee.name ?? ""),
    eventUuid: extractUuidFromCalendlyUri(scheduledUri),
    utmContent: String(tracking.utm_content ?? "").trim(),
    startTime: String(scheduled.start_time ?? ""),
    questionsAndAnswers,
  };
}

export function getCalendlyApiToken(): string {
  const token = process.env.CALENDLY_API_TOKEN?.trim();
  if (!token) {
    throw new Error("CALENDLY_API_TOKEN is not set");
  }
  return token;
}

export function extractEventUuidFromPayload(
  payload: Record<string, unknown> | null,
): string | null {
  if (!payload) return null;

  const inner =
    payload.payload && typeof payload.payload === "object"
      ? (payload.payload as Record<string, unknown>)
      : payload;
  const scheduled = inner.scheduled_event;
  if (!scheduled || typeof scheduled !== "object") return null;

  const uri = String((scheduled as Record<string, unknown>).uri ?? "").trim();
  if (!uri) return null;
  return extractUuidFromCalendlyUri(uri);
}

export async function cancelScheduledEvent(
  eventUuid: string,
  reason: string,
): Promise<void> {
  const token = getCalendlyApiToken();
  const response = await fetch(
    `https://api.calendly.com/scheduled_events/${eventUuid}/cancellation`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason: reason.slice(0, 10000) }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Calendly cancel HTTP ${response.status}: ${body}`);
  }
}

export function parseInviteeCanceledPayload(
  payload: unknown,
): { email: string; inviteeUri: string } | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as { event?: string; payload?: Record<string, unknown> };
  if (body.event !== "invitee.canceled") return null;

  const invitee = (body.payload ?? {}) as Record<string, unknown>;
  const email = String(invitee.email ?? "").trim().toLowerCase();
  const inviteeUri = String(invitee.uri ?? "").trim();
  if (!email) return null;

  return { email, inviteeUri };
}
