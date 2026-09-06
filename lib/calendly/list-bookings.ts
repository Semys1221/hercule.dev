import {
  extractJoinUrlFromLocation,
  getCalendlyApiToken,
  getScheduledEventInvitee,
  parseEventAndInviteeUuids,
} from "@/lib/calendly";
import {
  createLinkTrackingClient,
  findLeadByCalendlyInviteeUri,
  findLeadByEmail,
  findLeadByLink,
  normalizeEmail,
} from "@/lib/link-tracking/supabase";
import type { LeadCategory, LeadLookup } from "@/lib/link-tracking/types";

const CALENDLY_API = "https://api.calendly.com";

export type CalendlyBookingRow = {
  email: string;
  name: string;
  first_name: string | null;
  company: string | null;
  start_time: string;
  invitee_uri: string;
  event_uri: string;
  questions: Record<string, string>;
  slug: string | null;
  lead_id: string | null;
  lead_category: LeadCategory | null;
  booking_category: LeadCategory;
  calendly_join_url: string | null;
  calendly_reschedule_url: string | null;
  calendly_cancel_url: string | null;
};

type CalendlyListPayload = {
  collection?: Record<string, unknown>[];
  pagination?: { next_page_token?: string };
};

async function calendlyGet(
  path: string,
  params?: Record<string, string>,
): Promise<CalendlyListPayload> {
  const token = getCalendlyApiToken();
  const url = new URL(`${CALENDLY_API}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Calendly ${response.status}: ${body}`);
  }

  return (await response.json()) as CalendlyListPayload;
}

async function paginate(
  path: string,
  params: Record<string, string>,
): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  let nextToken = "";

  while (true) {
    const query = { ...params };
    if (nextToken) {
      query.page_token = nextToken;
    }
    const payload = await calendlyGet(path, query);
    items.push(...(payload.collection ?? []));
    nextToken = String(payload.pagination?.next_page_token ?? "");
    if (!nextToken) {
      break;
    }
  }

  return items;
}

async function getCurrentUserUri(): Promise<string> {
  const payload = await calendlyGet("/users/me");
  const uri = String(
    (payload as { resource?: { uri?: string } }).resource?.uri ?? "",
  ).trim();
  if (!uri) {
    throw new Error("Calendly /users/me returned no user uri");
  }
  return uri;
}

function firstName(fullName: string): string | null {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.split(/\s+/)[0] ?? null;
}

function companyFromQuestions(
  questions: Array<{ question?: string; answer?: string }>,
): string | null {
  const keys = ["entreprise", "société", "societe", "company", "agence", "cabinet"];
  for (const item of questions) {
    const question = String(item.question ?? "").toLowerCase();
    const answer = String(item.answer ?? "").trim();
    if (answer && keys.some((key) => question.includes(key))) {
      return answer;
    }
  }
  return null;
}

function questionsFromInvitee(
  invitee: Record<string, unknown>,
): Record<string, string> {
  const raw = invitee.questions_and_answers;
  const questions: Record<string, string> = {};
  if (!Array.isArray(raw)) {
    return questions;
  }

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as { question?: string; answer?: string };
    const question = String(row.question ?? "").trim();
    const answer = String(row.answer ?? "").trim();
    if (question) {
      questions[question] = answer;
    }
  }

  return questions;
}

function meetingLinksFromInvitee(
  invitee: Record<string, unknown>,
  event: Record<string, unknown>,
): {
  calendly_join_url: string | null;
  calendly_reschedule_url: string | null;
  calendly_cancel_url: string | null;
} {
  const cancelUrl = String(invitee.cancel_url ?? "").trim() || null;
  const rescheduleUrl = String(invitee.reschedule_url ?? "").trim() || null;
  const joinUrl = extractJoinUrlFromLocation(event.location) ?? null;

  return {
    calendly_join_url: joinUrl,
    calendly_reschedule_url: rescheduleUrl,
    calendly_cancel_url: cancelUrl,
  };
}

async function resolveMeetingLinksFallback(
  inviteeUri: string,
  links: {
    calendly_join_url: string | null;
    calendly_reschedule_url: string | null;
    calendly_cancel_url: string | null;
  },
): Promise<{
  calendly_join_url: string | null;
  calendly_reschedule_url: string | null;
  calendly_cancel_url: string | null;
}> {
  if (links.calendly_cancel_url && links.calendly_reschedule_url) {
    return links;
  }

  const uuids = parseEventAndInviteeUuids(inviteeUri);
  if (!uuids) {
    return links;
  }

  try {
    const fetched = await getScheduledEventInvitee(uuids.eventUuid, uuids.inviteeUuid);
    return {
      calendly_join_url: links.calendly_join_url ?? fetched.joinUrl,
      calendly_reschedule_url: links.calendly_reschedule_url ?? fetched.rescheduleUrl,
      calendly_cancel_url: links.calendly_cancel_url ?? fetched.cancelUrl,
    };
  } catch {
    return links;
  }
}

export async function resolveLeadLookup(
  inviteeEmail: string,
  utmContent: string,
  inviteeUri: string,
): Promise<LeadLookup | null> {
  const client = createLinkTrackingClient();
  const byEmail = await findLeadByEmail(client, inviteeEmail);
  if (byEmail) {
    return byEmail;
  }
  if (utmContent) {
    const bySlug = await findLeadByLink(client, utmContent);
    if (bySlug) {
      return bySlug;
    }
  }
  if (inviteeUri) {
    return findLeadByCalendlyInviteeUri(client, inviteeUri);
  }
  return null;
}

function resolveBookingCategory(
  utmContent: string,
  lookup: LeadLookup | null,
): LeadCategory {
  if (lookup) {
    return lookup.category;
  }
  if (utmContent) {
    return "agence";
  }
  return "agence";
}

export function isUpcomingBooking(startTime: string, now = new Date()): boolean {
  const parsed = new Date(startTime);
  return !Number.isNaN(parsed.getTime()) && parsed >= now;
}

export async function listUpcomingBookings(options: {
  daysAhead?: number;
  category?: LeadCategory;
  now?: Date;
}): Promise<CalendlyBookingRow[]> {
  const daysAhead = options.daysAhead ?? 30;
  const now = options.now ?? new Date();
  const userUri = await getCurrentUserUri();
  const maxTime = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const events = await paginate("/scheduled_events", {
    user: userUri,
    status: "active",
    min_start_time: now.toISOString(),
    max_start_time: maxTime.toISOString(),
    count: "100",
  });

  const rows: CalendlyBookingRow[] = [];

  for (const event of events) {
    const eventUri = String(event.uri ?? "");
    const eventUuid = eventUri.replace(/\/$/, "").split("/").pop() ?? "";
    const eventStart = String(event.start_time ?? "");
    if (!eventUuid || !eventStart || !isUpcomingBooking(eventStart, now)) {
      continue;
    }

    const invitees = await paginate(`/scheduled_events/${eventUuid}/invitees`, {
      count: "100",
    });

    for (const invitee of invitees) {
      const email = normalizeEmail(String(invitee.email ?? ""));
      if (!email) {
        continue;
      }

      const rawQA = Array.isArray(invitee.questions_and_answers)
        ? (invitee.questions_and_answers as Array<{ question?: string; answer?: string }>)
        : [];
      const questions = questionsFromInvitee(invitee);
      const tracking = (invitee.tracking ?? {}) as Record<string, string>;
      const utmContent = String(tracking.utm_content ?? "").trim();
      const inviteeUri = String(invitee.uri ?? "").trim();
      const lookup = await resolveLeadLookup(email, utmContent, inviteeUri);
      const bookingCategory = resolveBookingCategory(utmContent, lookup);

      if (options.category && bookingCategory !== options.category) {
        continue;
      }

      const rawLinks = meetingLinksFromInvitee(invitee, event);
      const meetingLinks = await resolveMeetingLinksFallback(inviteeUri, rawLinks);
      const slug = lookup?.lead.slug?.trim() || utmContent || null;

      rows.push({
        email,
        name: String(invitee.name ?? "").trim(),
        first_name: firstName(String(invitee.name ?? "")),
        company: companyFromQuestions(rawQA),
        start_time: eventStart,
        invitee_uri: inviteeUri,
        event_uri: eventUri,
        questions,
        slug,
        lead_id: lookup?.lead.id ?? null,
        lead_category: lookup?.category ?? null,
        booking_category: bookingCategory,
        ...meetingLinks,
      });
    }
  }

  rows.sort((a, b) => a.start_time.localeCompare(b.start_time));
  return rows;
}
