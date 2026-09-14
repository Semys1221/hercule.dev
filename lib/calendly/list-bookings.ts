import {
  extractJoinUrlFromLocation,
  getCalendlyApiToken,
  getScheduledEventInvitee,
  parseEventAndInviteeUuids,
} from "@/lib/calendly";
import { mapWithConcurrency } from "@/lib/calendly/map-with-concurrency";
import {
  createLinkTrackingClient,
  findLeadByCalendlyInviteeUri,
  findLeadByEmail,
  findLeadByLink,
  findLeadsByCalendlyInviteeUris,
  findLeadsByEmails,
  findLeadsBySlugs,
  normalizeEmail,
} from "@/lib/link-tracking/supabase";
import { finalizeBookingRows } from "@/lib/admin/bookings/booking-row-filters";
import { resolveCalendlyEventTypeUri } from "@/lib/admin/niches/outreach-config";
import type { LeadCategory, LeadLookup } from "@/lib/link-tracking/types";

const CALENDLY_API = "https://api.calendly.com";
const INVITEE_FETCH_CONCURRENCY = 5;

export type CalendlyBookingLifecycleStatus = "active" | "canceled";

export type CalendlyBookingRow = {
  email: string;
  name: string;
  first_name: string | null;
  company: string | null;
  start_time: string;
  invitee_uri: string;
  event_uri: string;
  event_status: CalendlyBookingLifecycleStatus;
  invitee_status: CalendlyBookingLifecycleStatus;
  questions: Record<string, string>;
  slug: string | null;
  lead_id: string | null;
  lead_category: LeadCategory | null;
  booking_category: LeadCategory;
  calendly_join_url: string | null;
  calendly_reschedule_url: string | null;
  calendly_cancel_url: string | null;
};

export function isCalendlyBookingCanceled(
  booking: Pick<CalendlyBookingRow, "event_status" | "invitee_status">,
): boolean {
  return booking.event_status === "canceled" || booking.invitee_status === "canceled";
}

function lifecycleStatusFromRecord(
  value: unknown,
): CalendlyBookingLifecycleStatus {
  return String(value ?? "active").toLowerCase() === "canceled" ? "canceled" : "active";
}

type CalendlyListPayload = {
  collection?: Record<string, unknown>[];
  pagination?: { next_page_token?: string };
};

type InviteeCandidate = {
  email: string;
  utmContent: string;
  inviteeUri: string;
};

type ParsedEventInvitee = {
  event: Record<string, unknown>;
  eventUri: string;
  eventStart: string;
  invitee: Record<string, unknown>;
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

export function resolveLeadFromBatchMaps(
  candidate: InviteeCandidate,
  byEmail: Map<string, LeadLookup>,
  bySlug: Map<string, LeadLookup>,
  byInviteeUri: Map<string, LeadLookup>,
): LeadLookup | null {
  const emailLookup = byEmail.get(normalizeEmail(candidate.email)) ?? null;
  const slugLookup = candidate.utmContent
    ? bySlug.get(candidate.utmContent.trim()) ?? null
    : null;
  const inviteeLookup = candidate.inviteeUri
    ? byInviteeUri.get(candidate.inviteeUri.trim()) ?? null
    : null;

  return emailLookup ?? slugLookup ?? inviteeLookup ?? null;
}

export async function batchResolveLeadLookups(
  candidates: InviteeCandidate[],
): Promise<Map<string, LeadLookup | null>> {
  const client = createLinkTrackingClient();

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "081f8d" },
    body: JSON.stringify({
      sessionId: "081f8d",
      runId: "pre-fix",
      hypothesisId: "H3-H5",
      location: "list-bookings.ts:batchResolveLeadLookups",
      message: "Batch lead lookup scope",
      data: {
        candidateCount: candidates.length,
        scopeCategory: null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const [byEmail, bySlug, byInviteeUri] = await Promise.all([
    findLeadsByEmails(client, candidates.map((candidate) => candidate.email)),
    findLeadsBySlugs(client, candidates.map((candidate) => candidate.utmContent)),
    findLeadsByCalendlyInviteeUris(
      client,
      candidates.map((candidate) => candidate.inviteeUri),
    ),
  ]);

  const resolved = new Map<string, LeadLookup | null>();
  for (const candidate of candidates) {
    const key = candidate.inviteeUri || candidate.email;
    resolved.set(key, resolveLeadFromBatchMaps(candidate, byEmail, bySlug, byInviteeUri));
  }

  return resolved;
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

async function fetchEventInvitees(
  event: Record<string, unknown>,
  now: Date,
  includePast = false,
): Promise<ParsedEventInvitee[]> {
  const eventUri = String(event.uri ?? "");
  const eventUuid = eventUri.replace(/\/$/, "").split("/").pop() ?? "";
  const eventStart = String(event.start_time ?? "");
  if (
    !eventUuid ||
    !eventStart ||
    (!includePast && !isUpcomingBooking(eventStart, now))
  ) {
    return [];
  }

  const invitees = await paginate(`/scheduled_events/${eventUuid}/invitees`, {
    count: "100",
  });

  return invitees.map((invitee) => ({
    event,
    eventUri,
    eventStart,
    invitee,
  }));
}

/** @internal Exported for unit tests. */
export function bookingsPipelineBlockedByMissingEventType(
  niche: LeadCategory | undefined,
  eventTypeUri: string | undefined,
): boolean {
  return Boolean(niche && !eventTypeUri);
}

export function buildScheduledEventsListParams(options: {
  userUri: string;
  minTime: string;
  maxTime: string;
  eventTypeUri?: string | null;
  status?: CalendlyBookingLifecycleStatus;
}): Record<string, string> {
  const params: Record<string, string> = {
    user: options.userUri,
    status: options.status ?? "active",
    min_start_time: options.minTime,
    max_start_time: options.maxTime,
    count: "100",
  };
  if (options.eventTypeUri) {
    params.event_type = options.eventTypeUri;
  }
  return params;
}

/** @internal Exported for unit tests. */
export function mergeScheduledEventsByUri(
  events: Record<string, unknown>[],
): Record<string, unknown>[] {
  const byUri = new Map<string, Record<string, unknown>>();
  for (const event of events) {
    const uri = String(event.uri ?? "").trim();
    if (uri) {
      byUri.set(uri, event);
    }
  }
  return [...byUri.values()];
}

async function listScheduledEventsInWindow(
  options: Parameters<typeof buildScheduledEventsListParams>[0],
): Promise<Record<string, unknown>[]> {
  const [activeEvents, canceledEvents] = await Promise.all([
    paginate("/scheduled_events", buildScheduledEventsListParams({ ...options, status: "active" })),
    paginate(
      "/scheduled_events",
      buildScheduledEventsListParams({ ...options, status: "canceled" }),
    ),
  ]);
  return mergeScheduledEventsByUri([...activeEvents, ...canceledEvents]);
}

export async function listUpcomingBookings(options: {
  daysAhead?: number;
  daysBehind?: number;
  /** Bookings CRM: filter by Calendly event type URI for this niche. */
  niche?: LeadCategory;
  /** Legacy: post-filter by resolved lead category (non-CRM callers). */
  category?: LeadCategory;
  now?: Date;
}): Promise<CalendlyBookingRow[]> {
  const daysAhead = options.daysAhead ?? 30;
  const daysBehind = options.daysBehind ?? 0;
  const includePast = daysBehind > 0;
  const now = options.now ?? new Date();
  const userUri = await getCurrentUserUri();
  const minTime = new Date(now.getTime() - daysBehind * 24 * 60 * 60 * 1000);
  const maxTime = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const resolvedEventTypeUri = options.niche
    ? await resolveCalendlyEventTypeUri(options.niche)
    : null;

  const eventListOptions = {
    userUri,
    minTime: minTime.toISOString(),
    maxTime: maxTime.toISOString(),
    eventTypeUri: resolvedEventTypeUri,
  };
  const listParams = buildScheduledEventsListParams(eventListOptions);

  if (bookingsPipelineBlockedByMissingEventType(options.niche, listParams.event_type)) {
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d17331" },
      body: JSON.stringify({
        sessionId: "d17331",
        runId: "pre-fix",
        hypothesisId: "H1",
        location: "list-bookings.ts:blocked-missing-event-type",
        message: "Bookings pipeline blocked — no event type URI",
        data: { niche: options.niche ?? null },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return [];
  }

  const eventsFetchStartedAt = Date.now();
  const events = await listScheduledEventsInWindow(eventListOptions);
  const eventsFetchDurationMs = Date.now() - eventsFetchStartedAt;

  const inviteesFetchStartedAt = Date.now();
  const parsedInvitees = (
    await mapWithConcurrency(events, INVITEE_FETCH_CONCURRENCY, (event) =>
      fetchEventInvitees(event, now, includePast),
    )
  ).flat();
  const inviteesFetchDurationMs = Date.now() - inviteesFetchStartedAt;

  const candidates: InviteeCandidate[] = [];
  for (const { invitee } of parsedInvitees) {
    const email = normalizeEmail(String(invitee.email ?? ""));
    if (!email) {
      continue;
    }

    const tracking = (invitee.tracking ?? {}) as Record<string, string>;
    candidates.push({
      email,
      utmContent: String(tracking.utm_content ?? "").trim(),
      inviteeUri: String(invitee.uri ?? "").trim(),
    });
  }

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "2ea86d" },
    body: JSON.stringify({
      sessionId: "2ea86d",
      runId: "pre-fix",
      hypothesisId: "H1-H2",
      location: "list-bookings.ts:listUpcomingBookings:pre-filter",
      message: "Calendly events fetched before row build",
      data: {
        niche: options.niche ?? null,
        category: options.category ?? null,
        resolvedEventTypeUri,
        eventCount: events.length,
        parsedInviteeCount: parsedInvitees.length,
        candidateCount: candidates.length,
        eventsFetchDurationMs,
        inviteesFetchDurationMs,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const lookupByKey = await batchResolveLeadLookups(candidates);
  const rows: CalendlyBookingRow[] = [];
  const seenInviteeUris = new Set<string>();

  let skippedWrongEventType = 0;

  for (const { event, eventUri, eventStart, invitee } of parsedInvitees) {
    const email = normalizeEmail(String(invitee.email ?? ""));
    if (!email) {
      continue;
    }

    if (resolvedEventTypeUri) {
      const rowEventTypeUri = String(event.event_type ?? "").trim();
      if (rowEventTypeUri !== resolvedEventTypeUri) {
        skippedWrongEventType += 1;
        continue;
      }
    }

    const rawQA = Array.isArray(invitee.questions_and_answers)
      ? (invitee.questions_and_answers as Array<{ question?: string; answer?: string }>)
      : [];
    const questions = questionsFromInvitee(invitee);
    const tracking = (invitee.tracking ?? {}) as Record<string, string>;
    const utmContent = String(tracking.utm_content ?? "").trim();
    const inviteeUri = String(invitee.uri ?? "").trim();
    if (inviteeUri) {
      if (seenInviteeUris.has(inviteeUri)) {
        continue;
      }
      seenInviteeUris.add(inviteeUri);
    }
    const lookupKey = inviteeUri || email;
    const lookup = lookupByKey.get(lookupKey) ?? null;
    const bookingCategory = resolveBookingCategory(utmContent, lookup);

    if (!options.niche && options.category && bookingCategory !== options.category) {
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
      event_status: lifecycleStatusFromRecord(event.status),
      invitee_status: lifecycleStatusFromRecord(invitee.status),
      questions,
      slug,
      lead_id: lookup?.lead.id ?? null,
      lead_category: lookup?.category ?? null,
      booking_category: bookingCategory,
      ...meetingLinks,
    });
  }

  const finalizedRows = finalizeBookingRows(rows);
  finalizedRows.sort((a, b) => a.start_time.localeCompare(b.start_time));

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d17331" },
    body: JSON.stringify({
      sessionId: "d17331",
      runId: "pre-fix",
      hypothesisId: "H1",
      location: "list-bookings.ts:listUpcomingBookings:post-filter",
      message: "Bookings rows after event-type filter",
      data: {
        niche: options.niche ?? null,
        resolvedEventTypeUri,
        rowCount: finalizedRows.length,
        rawRowCount: rows.length,
        skippedWrongEventType,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return finalizedRows;
}
