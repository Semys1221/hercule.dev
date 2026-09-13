import {
  loadBookingsPage,
  readCachedBookingsPage,
} from "@/lib/admin/bookings/load-bookings-page";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import type { Niche } from "@/lib/admin/navigation";

export type FetchEnrichedBookingsResult = {
  bookings: EnrichedCalendlyBooking[];
  error: string | null;
  fromCache?: boolean;
  calendlyConfigured?: boolean;
  campaignLinked?: boolean;
};

export async function fetchEnrichedBookings(
  niche: Niche,
  options?: { fresh?: boolean; daysBehind?: number; legacyCategory?: boolean },
): Promise<FetchEnrichedBookingsResult> {
  const daysBehind = options?.daysBehind ?? 0;

  if (options?.legacyCategory) {
    const params = new URLSearchParams({ category: niche });
    if (options?.fresh) {
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
      error: null,
      fromCache: false,
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
    calendlyConfigured: page.calendlyConfigured,
    campaignLinked: page.campaignLinked,
  };
}
