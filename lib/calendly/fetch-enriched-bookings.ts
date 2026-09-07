import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import {
  readBookingsClientCache,
  writeBookingsClientCache,
} from "@/lib/calendly/bookings-client-cache";
import type { Audience } from "@/lib/admin/navigation";

export type FetchEnrichedBookingsResult = {
  bookings: EnrichedCalendlyBooking[];
  error: string | null;
  fromCache?: boolean;
};

export async function fetchEnrichedBookings(
  audience: Audience,
  options?: { fresh?: boolean },
): Promise<FetchEnrichedBookingsResult> {
  if (!options?.fresh) {
    const cached = readBookingsClientCache(audience);
    if (cached) {
      return { bookings: cached.bookings, error: null, fromCache: true };
    }
  }

  const params = new URLSearchParams({ category: audience });
  if (options?.fresh) {
    params.set("fresh", "1");
  }
  const response = await fetch(`/api/admin/calendly/bookings?${params.toString()}`);
  const body = (await response.json()) as {
    bookings?: EnrichedCalendlyBooking[];
    error?: string;
  };

  if (!response.ok) {
    return {
      bookings: [],
      error: body.error ?? "Impossible de récupérer les rendez-vous",
    };
  }

  const bookings = body.bookings ?? [];
  writeBookingsClientCache(audience, bookings);

  return { bookings, error: null, fromCache: false };
}
