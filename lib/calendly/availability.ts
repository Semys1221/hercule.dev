import { getCalendlyApiToken } from "@/lib/calendly";

const CALENDLY_API_BASE = "https://api.calendly.com";
const PARIS_TIMEZONE = "Europe/Paris";
const FULLY_BOOKED_THRESHOLD_HOURS = 48;
const WINDOW_DAYS = 7;
const DEFAULT_HORIZON_DAYS = 42;
const MIN_FUTURE_BUFFER_MS = 60_000;

export type CalendlyBookingEvent = "agence" | "comptable" | "entreprise" | "cif";

export const CALENDLY_BOOKING_EVENTS: CalendlyBookingEvent[] = [
  "agence",
  "comptable",
  "entreprise",
  "cif",
];

export const CALENDLY_SCHEDULING_URLS: Record<CalendlyBookingEvent, string | null> = {
  agence: "https://calendly.com/hercule-connect/30min",
  entreprise:
    "https://calendly.com/hercule-connect/candidature-web-apport-d-affaires-clone",
  comptable:
    "https://calendly.com/hercule-connect/candidature-web-apport-d-affaires-clone",
  cif: "https://calendly.com/hercule-connect/hercule-comptable-clone",
};

const EVENT_TYPE_URI_ENV: Record<CalendlyBookingEvent, string> = {
  agence: "CALENDLY_EVENT_TYPE_URI_AGENCE",
  entreprise: "CALENDLY_EVENT_TYPE_URI_ENTREPRISE",
  comptable: "CALENDLY_EVENT_TYPE_URI_COMPTABLE",
  cif: "CALENDLY_EVENT_TYPE_URI_CIF",
};

const eventTypeUriCache: Partial<Record<CalendlyBookingEvent, string>> = {};

export type AvailabilityMessage = {
  prefix: string;
  fullFrom?: string;
  middle?: string;
  fullUntil?: string;
  suffix?: string;
  nextAvailable?: string;
  end?: string;
};

export type AvailabilitySummary = {
  ok: true;
  isFullyBooked: boolean;
  noSlotsInHorizon?: boolean;
  fullFromLabel?: string;
  fullUntilLabel?: string;
  nextAvailableLabel?: string;
  message: AvailabilityMessage;
};

type CalendlyAvailableTime = {
  status?: string;
  start_time?: string;
};

export function parseBookingEvent(
  value: string | null | undefined,
): CalendlyBookingEvent | null {
  const normalized = value?.trim().toLowerCase();
  if (
    normalized === "agence" ||
    normalized === "entreprise" ||
    normalized === "comptable" ||
    normalized === "cif"
  ) {
    return normalized;
  }
  return null;
}

export function formatFrenchDateLabel(
  date: Date,
  timeZone = PARIS_TIMEZONE,
): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    day: "numeric",
    month: "long",
  }).format(date);
}

/** e.g. mardi 10 septembre à 14h30 */
export function formatFrenchSlotLabel(
  date: Date,
  timeZone = PARIS_TIMEZONE,
): string {
  const weekday = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    weekday: "long",
  }).format(date);
  const dayMonth = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    day: "numeric",
    month: "long",
  }).format(date);
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "0";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  const timeLabel = minute === "00" ? `${hour}h` : `${hour}h${minute}`;
  return `${weekday} ${dayMonth} à ${timeLabel}`;
}

function getParisCalendarDate(date: Date, timeZone = PARIS_TIMEZONE): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function addCalendarDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function normalizeSchedulingUrl(url: string): string {
  return url.trim().replace(/\/$/, "").toLowerCase();
}

function toIsoUtc(date: Date): string {
  return date.toISOString();
}

export function getEarliestQueryableTime(now: Date = new Date()): Date {
  return new Date(now.getTime() + MIN_FUTURE_BUFFER_MS);
}

async function calendlyGet<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const token = getCalendlyApiToken();
  const url = new URL(`${CALENDLY_API_BASE}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Calendly ${response.status} on ${path}: ${text}`);
  }

  return JSON.parse(text) as T;
}

async function listEventTypesForUser(userUri: string): Promise<
  Array<{ uri?: string; scheduling_url?: string }>
> {
  const items: Array<{ uri?: string; scheduling_url?: string }> = [];
  let pageToken = "";

  while (true) {
    const params: Record<string, string> = {
      user: userUri,
      active: "true",
      count: "100",
    };
    if (pageToken) {
      params.page_token = pageToken;
    }

    const payload = await calendlyGet<{
      collection?: Array<{ uri?: string; scheduling_url?: string }>;
      pagination?: { next_page_token?: string };
    }>("/event_types", params);

    items.push(...(payload.collection ?? []));
    pageToken = payload.pagination?.next_page_token?.trim() ?? "";
    if (!pageToken) {
      break;
    }
  }

  return items;
}

async function resolveEventTypeUriBySchedulingUrl(
  schedulingUrl: string,
): Promise<string> {
  const me = await calendlyGet<{ resource?: { uri?: string } }>("/users/me");
  const userUri = me.resource?.uri?.trim();
  if (!userUri) {
    throw new Error("Calendly /users/me returned no user URI");
  }

  const target = normalizeSchedulingUrl(schedulingUrl);
  const eventTypes = await listEventTypesForUser(userUri);
  const match = eventTypes.find(
    (eventType) =>
      normalizeSchedulingUrl(String(eventType.scheduling_url ?? "")) === target,
  );

  const uri = match?.uri?.trim();
  if (!uri) {
    throw new Error(`No Calendly event type found for ${schedulingUrl}`);
  }

  return uri;
}

export async function getEventTypeUri(
  event: CalendlyBookingEvent,
): Promise<string> {
  const cached = eventTypeUriCache[event];
  if (cached) {
    return cached;
  }

  const envKey = EVENT_TYPE_URI_ENV[event];
  const fromEnv = process.env[envKey]?.trim();
  if (fromEnv) {
    eventTypeUriCache[event] = fromEnv;
    return fromEnv;
  }

  const schedulingUrl = CALENDLY_SCHEDULING_URLS[event];
  if (!schedulingUrl) {
    throw new Error(`Calendly event type not configured for ${event}`);
  }

  const resolved = await resolveEventTypeUriBySchedulingUrl(schedulingUrl);
  eventTypeUriCache[event] = resolved;
  return resolved;
}

export async function fetchAvailableTimesWindow(
  eventTypeUri: string,
  start: Date,
  end: Date,
): Promise<CalendlyAvailableTime[]> {
  const payload = await calendlyGet<{ collection?: CalendlyAvailableTime[] }>(
    "/event_type_available_times",
    {
      event_type: eventTypeUri,
      start_time: toIsoUtc(start),
      end_time: toIsoUtc(end),
    },
  );

  return payload.collection ?? [];
}

export async function findNextAvailableSlotsForEventType(
  eventTypeUri: string,
  count = 2,
  horizonDays = DEFAULT_HORIZON_DAYS,
): Promise<Date[]> {
  const targetCount = Math.max(1, count);
  const now = new Date();
  const horizonEnd = new Date(
    now.getTime() + horizonDays * 24 * 60 * 60 * 1000,
  );
  let windowStart = getEarliestQueryableTime(now);
  const collected: Date[] = [];

  while (windowStart < horizonEnd && collected.length < targetCount) {
    const windowEnd = new Date(
      Math.min(
        windowStart.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000,
        horizonEnd.getTime(),
      ),
    );

    const slots = await fetchAvailableTimesWindow(
      eventTypeUri,
      windowStart,
      windowEnd,
    );
    const available = slots
      .filter((slot) => slot.status === "available" && slot.start_time)
      .sort(
        (left, right) =>
          new Date(left.start_time ?? 0).getTime() -
          new Date(right.start_time ?? 0).getTime(),
      );

    for (const slot of available) {
      if (collected.length >= targetCount) {
        break;
      }
      collected.push(new Date(slot.start_time as string));
    }

    windowStart = windowEnd;
  }

  return collected;
}

export async function findNextAvailableSlots(
  event: CalendlyBookingEvent,
  count = 2,
  horizonDays = DEFAULT_HORIZON_DAYS,
): Promise<Date[]> {
  const eventTypeUri = await getEventTypeUri(event);
  return findNextAvailableSlotsForEventType(eventTypeUri, count, horizonDays);
}

export async function findFirstAvailableSlot(
  eventTypeUri: string,
  horizonDays = DEFAULT_HORIZON_DAYS,
): Promise<Date | null> {
  const slots = await findNextAvailableSlotsForEventType(
    eventTypeUri,
    1,
    horizonDays,
  );
  return slots[0] ?? null;
}

export function buildAvailabilitySummary(
  firstSlot: Date | null,
  now: Date = new Date(),
): AvailabilitySummary {
  if (!firstSlot) {
    return {
      ok: true,
      isFullyBooked: true,
      noSlotsInHorizon: true,
      message: {
        prefix:
          "Agenda complet pour le moment. Nous ouvrons de nouveaux créneaux régulièrement.",
      },
    };
  }

  const hoursUntilSlot =
    (firstSlot.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilSlot <= FULLY_BOOKED_THRESHOLD_HOURS) {
    return {
      ok: true,
      isFullyBooked: false,
      message: {
        prefix: "",
      },
    };
  }

  const today = getParisCalendarDate(now);
  const firstSlotDay = getParisCalendarDate(firstSlot);
  const fullUntilDay = addCalendarDays(firstSlotDay, -1);

  const fullFromLabel = formatFrenchDateLabel(today);
  const fullUntilLabel = formatFrenchDateLabel(fullUntilDay);
  const nextAvailableLabel = formatFrenchDateLabel(firstSlotDay);

  return {
    ok: true,
    isFullyBooked: true,
    fullFromLabel,
    fullUntilLabel,
    nextAvailableLabel,
    message: {
      prefix: "Nous sommes actuellement complets du ",
      fullFrom: fullFromLabel,
      middle: " au ",
      fullUntil: fullUntilLabel,
      suffix: ". Les prochains créneaux s'ouvrent le ",
      nextAvailable: nextAvailableLabel,
      end: ".",
    },
  };
}

export async function getAvailabilitySummary(
  event: CalendlyBookingEvent,
): Promise<AvailabilitySummary> {
  const eventTypeUri = await getEventTypeUri(event);
  const firstSlot = await findFirstAvailableSlot(eventTypeUri);
  return buildAvailabilitySummary(firstSlot);
}
