import type { BookingEmailJobSummary } from "@/lib/admin/bookings/email-jobs";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import type { Niche } from "@/lib/admin/navigation";

export type BookingsCampaignStats = {
  linked: boolean;
  sent?: number;
  replies?: number;
  interested?: number;
  replyPercent?: number | null;
  positivePercent?: number | null;
  error?: string;
};

export type BookingsPageCacheEntry = {
  version: 1;
  fetchedAt: number;
  eventTypeUri: string | null;
  bookings: EnrichedCalendlyBooking[];
  jobsByLeadId: Record<string, BookingEmailJobSummary[]>;
  campaignStats: BookingsCampaignStats | null;
  calendlyConfigured: boolean;
  campaignLinked: boolean;
};

type CacheStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const CACHE_VERSION = 1;

function cacheKey(niche: Niche, daysBehind: number): string {
  return `hercule:bookings-page:v${CACHE_VERSION}:${niche}:${daysBehind}`;
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

function parseEntry(raw: string): BookingsPageCacheEntry | null {
  try {
    const parsed = JSON.parse(raw) as BookingsPageCacheEntry;
    if (
      !parsed ||
      parsed.version !== CACHE_VERSION ||
      typeof parsed.fetchedAt !== "number" ||
      !Array.isArray(parsed.bookings) ||
      typeof parsed.jobsByLeadId !== "object"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readBookingsPageCache(
  niche: Niche,
  daysBehind = 0,
  storage: CacheStorage | null = getLocalStorage(),
): BookingsPageCacheEntry | null {
  if (!storage) {
    return null;
  }
  const raw = storage.getItem(cacheKey(niche, daysBehind));
  if (!raw) {
    return null;
  }
  const entry = parseEntry(raw);
  if (!entry) {
    storage.removeItem(cacheKey(niche, daysBehind));
    return null;
  }
  return entry;
}

export function writeBookingsPageCache(
  niche: Niche,
  entry: Omit<BookingsPageCacheEntry, "version">,
  daysBehind = 0,
  storage: CacheStorage | null = getLocalStorage(),
): void {
  if (!storage) {
    return;
  }
  const payload: BookingsPageCacheEntry = { version: CACHE_VERSION, ...entry };
  try {
    storage.setItem(cacheKey(niche, daysBehind), JSON.stringify(payload));
  } catch {
    // localStorage full or unavailable
  }
}

export function clearBookingsPageCache(
  niche: Niche,
  daysBehind = 0,
  storage: CacheStorage | null = getLocalStorage(),
): void {
  if (!storage) {
    return;
  }
  storage.removeItem(cacheKey(niche, daysBehind));
}

export function formatBookingsCacheAge(fetchedAt: number, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - fetchedAt) / 60_000));
  if (minutes < 1) {
    return "à l'instant";
  }
  if (minutes < 60) {
    return `il y a ${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `il y a ${hours} h`;
  }
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}
