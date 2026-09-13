import type { BookingEmailJobSummary } from "@/lib/admin/bookings/email-jobs";
import {
  readBookingsPageCache,
  writeBookingsPageCache,
  type BookingsCampaignStats,
  type BookingsPageCacheEntry,
} from "@/lib/admin/bookings/bookings-page-cache";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import type { Niche } from "@/lib/admin/navigation";

export type BookingsPageData = {
  bookings: EnrichedCalendlyBooking[];
  jobsByLeadId: Record<string, BookingEmailJobSummary[]>;
  campaignStats: BookingsCampaignStats | null;
  calendlyConfigured: boolean;
  campaignLinked: boolean;
  eventTypeUri: string | null;
  fetchedAt: number;
  fromCache: boolean;
  error: string | null;
};

type OutreachConfigSnapshot = {
  calendly_configured?: boolean;
  campaign_linked?: boolean;
  resolved_calendly_event_type_uri?: string | null;
};

async function loadOutreachConfig(niche: Niche): Promise<OutreachConfigSnapshot | null> {
  try {
    const response = await fetch(`/api/admin/niches/${niche}/outreach-config`);
    const body = (await response.json()) as { config?: OutreachConfigSnapshot };
    if (!response.ok || !body.config) {
      return null;
    }
    return body.config;
  } catch {
    return null;
  }
}

async function fetchBookingsFromApi(
  niche: Niche,
  daysBehind: number,
  fresh: boolean,
): Promise<{
  bookings: EnrichedCalendlyBooking[];
  outreach?: { calendly_configured?: boolean; campaign_linked?: boolean };
  error: string | null;
}> {
  const params = new URLSearchParams({ niche });
  if (fresh) {
    params.set("fresh", "1");
  }
  if (daysBehind > 0) {
    params.set("daysBehind", String(daysBehind));
  }

  const response = await fetch(`/api/admin/calendly/bookings?${params.toString()}`);
  const body = (await response.json()) as {
    bookings?: EnrichedCalendlyBooking[];
    error?: string;
    outreach?: {
      calendly_configured?: boolean;
      campaign_linked?: boolean;
    };
  };

  if (!response.ok) {
    return {
      bookings: [],
      error: body.error ?? "Impossible de récupérer les rendez-vous",
    };
  }

  return {
    bookings: body.bookings ?? [],
    outreach: body.outreach,
    error: null,
  };
}

async function fetchCampaignStats(niche: Niche): Promise<BookingsCampaignStats | null> {
  try {
    const response = await fetch(`/api/admin/niches/${niche}/campaign-stats`);
    const body = (await response.json()) as BookingsCampaignStats;
    if (!response.ok) {
      return null;
    }
    return body;
  } catch {
    return null;
  }
}

async function fetchEmailJobs(
  bookings: EnrichedCalendlyBooking[],
): Promise<Record<string, BookingEmailJobSummary[]>> {
  const leadIds = [
    ...new Set(bookings.map((booking) => booking.lead_id?.trim() ?? "").filter(Boolean)),
  ];

  if (leadIds.length === 0) {
    return {};
  }

  try {
    const response = await fetch(
      `/api/admin/bookings/email-jobs?leadIds=${encodeURIComponent(leadIds.join(","))}`,
    );
    const body = (await response.json()) as {
      jobsByLeadId?: Record<string, BookingEmailJobSummary[]>;
    };
    if (!response.ok) {
      return {};
    }
    return body.jobsByLeadId ?? {};
  } catch {
    return {};
  }
}

function toPageData(
  entry: ReturnType<typeof readBookingsPageCache>,
  fromCache: boolean,
): BookingsPageData | null {
  if (!entry) {
    return null;
  }
  return {
    bookings: entry.bookings,
    jobsByLeadId: entry.jobsByLeadId,
    campaignStats: entry.campaignStats,
    calendlyConfigured: entry.calendlyConfigured,
    campaignLinked: entry.campaignLinked,
    eventTypeUri: entry.eventTypeUri,
    fetchedAt: entry.fetchedAt,
    fromCache,
    error: null,
  };
}

export function readCachedBookingsPage(
  niche: Niche,
  daysBehind = 0,
): BookingsPageData | null {
  return toPageData(readBookingsPageCache(niche, daysBehind), true);
}

export async function loadBookingsPage(
  niche: Niche,
  options?: { fresh?: boolean; daysBehind?: number },
): Promise<BookingsPageData> {
  const daysBehind = options?.daysBehind ?? 0;

  if (!options?.fresh) {
    const cached = readCachedBookingsPage(niche, daysBehind);
    if (cached) {
      return cached;
    }
  }

  const outreachConfig = await loadOutreachConfig(niche);
  const eventTypeUri = outreachConfig?.resolved_calendly_event_type_uri ?? null;

  const [bookingsResult, campaignStats] = await Promise.all([
    fetchBookingsFromApi(niche, daysBehind, Boolean(options?.fresh)),
    fetchCampaignStats(niche),
  ]);

  if (bookingsResult.error) {
    const stale = readCachedBookingsPage(niche, daysBehind);
    if (stale) {
      return { ...stale, error: bookingsResult.error };
    }
    return {
      bookings: [],
      jobsByLeadId: {},
      campaignStats,
      calendlyConfigured: outreachConfig?.calendly_configured ?? true,
      campaignLinked: outreachConfig?.campaign_linked ?? false,
      eventTypeUri,
      fetchedAt: Date.now(),
      fromCache: false,
      error: bookingsResult.error,
    };
  }

  const jobsByLeadId = await fetchEmailJobs(bookingsResult.bookings);
  const fetchedAt = Date.now();

  const pageEntry = {
    fetchedAt,
    eventTypeUri,
    bookings: bookingsResult.bookings,
    jobsByLeadId,
    campaignStats,
    calendlyConfigured:
      bookingsResult.outreach?.calendly_configured ??
      outreachConfig?.calendly_configured ??
      true,
    campaignLinked:
      bookingsResult.outreach?.campaign_linked ??
      outreachConfig?.campaign_linked ??
      false,
  };

  writeBookingsPageCache(niche, pageEntry, daysBehind);

  return {
    ...pageEntry,
    fromCache: false,
    error: null,
  };
}

export function patchBookingsPageCache(
  niche: Niche,
  daysBehind: number,
  patch: Partial<
    Pick<
      BookingsPageCacheEntry,
      "bookings" | "jobsByLeadId" | "campaignStats" | "calendlyConfigured" | "campaignLinked"
    >
  >,
): void {
  const existing = readBookingsPageCache(niche, daysBehind);
  if (!existing) {
    return;
  }
  writeBookingsPageCache(
    niche,
    {
      fetchedAt: existing.fetchedAt,
      eventTypeUri: existing.eventTypeUri,
      bookings: patch.bookings ?? existing.bookings,
      jobsByLeadId: patch.jobsByLeadId ?? existing.jobsByLeadId,
      campaignStats: patch.campaignStats ?? existing.campaignStats,
      calendlyConfigured: patch.calendlyConfigured ?? existing.calendlyConfigured,
      campaignLinked: patch.campaignLinked ?? existing.campaignLinked,
    },
    daysBehind,
  );
}
