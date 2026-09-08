import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import {
  readBookingsClientCache,
  writeBookingsClientCache,
} from "@/lib/calendly/bookings-client-cache";
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

  if (!options?.fresh) {
    const cached = readBookingsClientCache(niche, daysBehind);
    if (cached) {
      return { bookings: cached.bookings, error: null, fromCache: true };
    }
  }

  const params = new URLSearchParams({ niche });
  if (options?.legacyCategory) {
    params.delete("niche");
    params.set("category", niche);
  }
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

  const bookings = body.bookings ?? [];
  writeBookingsClientCache(niche, bookings, daysBehind);

  return {
    bookings,
    error: null,
    fromCache: false,
    calendlyConfigured: body.outreach?.calendly_configured,
    campaignLinked: body.outreach?.campaign_linked,
  };
}
