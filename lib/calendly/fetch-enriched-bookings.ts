import {
  loadBookingsPage,
  readCachedBookingsPage,
} from "@/lib/admin/bookings/load-bookings-page";
import {
  readBookingsClientCache,
  writeBookingsClientCache,
} from "@/lib/calendly/bookings-client-cache";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import type { Niche } from "@/lib/admin/navigation";

export type FetchEnrichedBookingsResult = {
  bookings: EnrichedCalendlyBooking[];
  error: string | null;
  fromCache?: boolean;
  fetchedAt?: number;
  calendlyConfigured?: boolean;
  campaignLinked?: boolean;
};

function resultFromClientCache(
  niche: Niche,
  daysBehind: number,
): FetchEnrichedBookingsResult | null {
  const cached = readBookingsClientCache(niche, daysBehind);
  if (!cached) {
    return null;
  }
  return {
    bookings: cached.bookings,
    error: null,
    fromCache: true,
    fetchedAt: cached.fetchedAt,
    calendlyConfigured: cached.outreach?.calendly_configured,
    campaignLinked: cached.outreach?.campaign_linked,
  };
}

export async function fetchEnrichedBookings(
  niche: Niche,
  options?: { fresh?: boolean; daysBehind?: number; legacyCategory?: boolean },
): Promise<FetchEnrichedBookingsResult> {
  const daysBehind = options?.daysBehind ?? 0;

  if (options?.legacyCategory) {
    if (!options.fresh) {
      return (
        resultFromClientCache(niche, daysBehind) ?? {
          bookings: [],
          error: null,
          fromCache: true,
        }
      );
    }

    const params = new URLSearchParams({ category: niche, fresh: "1" });
    if (daysBehind > 0) {
      params.set("daysBehind", String(daysBehind));
    }

    const response = await fetch(`/api/admin/calendly/bookings?${params.toString()}`);
    let body: {
      bookings?: EnrichedCalendlyBooking[];
      error?: string;
      outreach?: {
        calendly_configured?: boolean;
        campaign_linked?: boolean;
      };
    };
    try {
      body = (await response.json()) as typeof body;
    } catch {
      const rawText = await response.text().catch(() => "");
      return {
        bookings: [],
        error: rawText.trim() || response.statusText || "Impossible de récupérer les rendez-vous",
      };
    }

    if (!response.ok) {
      const stale = resultFromClientCache(niche, daysBehind);
      if (stale) {
        return {
          ...stale,
          error: body.error ?? "Impossible de récupérer les rendez-vous",
        };
      }
      return {
        bookings: [],
        error: body.error ?? "Impossible de récupérer les rendez-vous",
      };
    }

    const bookings = body.bookings ?? [];
    const fetchedAt = Date.now();
    writeBookingsClientCache(
      niche,
      bookings,
      daysBehind,
      fetchedAt,
      undefined,
      {
        calendly_configured: body.outreach?.calendly_configured,
        campaign_linked: body.outreach?.campaign_linked,
      },
    );

    return {
      bookings,
      error: null,
      fromCache: false,
      fetchedAt,
      calendlyConfigured: body.outreach?.calendly_configured,
      campaignLinked: body.outreach?.campaign_linked,
    };
  }

  const page = options?.fresh
    ? await loadBookingsPage(niche, { fresh: true, daysBehind })
    : (readCachedBookingsPage(niche, daysBehind) ??
      await loadBookingsPage(niche, { fresh: true, daysBehind }));

  return {
    bookings: page.bookings,
    error: page.error,
    fromCache: page.fromCache,
    fetchedAt: page.fetchedAt,
    calendlyConfigured: page.calendlyConfigured,
    campaignLinked: page.campaignLinked,
  };
}
