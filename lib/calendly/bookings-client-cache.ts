import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import { BOOKINGS_CACHE_REVALIDATE_SECONDS } from "@/lib/calendly/bookings-cache-constants";
import type { Audience } from "@/lib/admin/navigation";

export type BookingsClientCacheEntry = {
  fetchedAt: number;
  bookings: EnrichedCalendlyBooking[];
};

type CacheStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function cacheKey(audience: Audience, daysBehind = 0): string {
  return `hercule:calendly-bookings:${audience}:${daysBehind}`;
}

function getSessionStorage(): CacheStorage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function isBookingsClientCacheEntryValid(
  entry: BookingsClientCacheEntry,
  now = Date.now(),
): boolean {
  return now - entry.fetchedAt <= BOOKINGS_CACHE_REVALIDATE_SECONDS * 1000;
}

export function readBookingsClientCache(
  audience: Audience,
  daysBehind = 0,
  now = Date.now(),
  storage: CacheStorage | null = getSessionStorage(),
): BookingsClientCacheEntry | null {
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(cacheKey(audience, daysBehind));
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

    const ageMs = now - parsed.fetchedAt;
    if (!isBookingsClientCacheEntryValid(parsed, now)) {
      storage.removeItem(cacheKey(audience, daysBehind));
      return null;
    }

    return parsed;
  } catch {
    storage.removeItem(cacheKey(audience, daysBehind));
    return null;
  }
}

export function writeBookingsClientCache(
  audience: Audience,
  bookings: EnrichedCalendlyBooking[],
  daysBehind = 0,
  fetchedAt = Date.now(),
  storage: CacheStorage | null = getSessionStorage(),
): void {
  if (!storage) {
    return;
  }

  const entry: BookingsClientCacheEntry = { fetchedAt, bookings };
  try {
    storage.setItem(cacheKey(audience, daysBehind), JSON.stringify(entry));
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}

export function clearBookingsClientCache(audience: Audience, daysBehind = 0): void {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }
  storage.removeItem(cacheKey(audience, daysBehind));
}
