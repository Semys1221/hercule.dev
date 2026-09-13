import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import type { Niche } from "@/lib/admin/navigation";

export type BookingsClientCacheOutreach = {
  calendly_configured?: boolean;
  campaign_linked?: boolean;
};

export type BookingsClientCacheEntry = {
  fetchedAt: number;
  bookings: EnrichedCalendlyBooking[];
  outreach?: BookingsClientCacheOutreach;
  eventTypeUri?: string | null;
};

type CacheStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function eventTypeCacheSegment(uri: string | null | undefined): string {
  if (!uri?.trim()) {
    return "none";
  }
  return uri.replace(/\/$/, "").split("/").pop() ?? "none";
}

function cacheKey(
  niche: Niche,
  daysBehind = 0,
  eventTypeUri?: string | null,
): string {
  return `hercule:calendly-bookings:v2:${niche}:${daysBehind}:${eventTypeCacheSegment(eventTypeUri)}`;
}

function getLocalStorage(): CacheStorage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isBookingsClientCacheEntryValid(
  entry: BookingsClientCacheEntry,
  _now = Date.now(),
): boolean {
  return Boolean(entry.fetchedAt);
}

export function readBookingsClientCache(
  niche: Niche,
  daysBehind = 0,
  eventTypeUri?: string | null,
  now = Date.now(),
  storage: CacheStorage | null = getLocalStorage(),
): BookingsClientCacheEntry | null {
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(cacheKey(niche, daysBehind, eventTypeUri));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as BookingsClientCacheEntry;
    if (
      !parsed ||
      typeof parsed.fetchedAt !== "number" ||
      !Array.isArray(parsed.bookings)
    ) {
      return null;
    }

    if (!isBookingsClientCacheEntryValid(parsed, now)) {
      storage.removeItem(cacheKey(niche, daysBehind, eventTypeUri));
      return null;
    }

    const expectedEventType = eventTypeUri?.trim() || null;
    const cachedEventType = parsed.eventTypeUri?.trim() || null;
    if (expectedEventType !== cachedEventType) {
      storage.removeItem(cacheKey(niche, daysBehind, eventTypeUri));
      return null;
    }

    return parsed;
  } catch {
    storage.removeItem(cacheKey(niche, daysBehind, eventTypeUri));
    return null;
  }
}

export function writeBookingsClientCache(
  niche: Niche,
  bookings: EnrichedCalendlyBooking[],
  daysBehind = 0,
  fetchedAt = Date.now(),
  storage: CacheStorage | null = getLocalStorage(),
  outreach?: BookingsClientCacheOutreach,
  eventTypeUri?: string | null,
): void {
  if (!storage) {
    return;
  }

  const entry: BookingsClientCacheEntry = {
    fetchedAt,
    bookings,
    outreach,
    eventTypeUri: eventTypeUri?.trim() || null,
  };
  try {
    storage.setItem(cacheKey(niche, daysBehind, eventTypeUri), JSON.stringify(entry));
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}

export function clearBookingsClientCache(
  niche: Niche,
  daysBehind = 0,
  eventTypeUri?: string | null,
): void {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }
  storage.removeItem(cacheKey(niche, daysBehind, eventTypeUri));
}
