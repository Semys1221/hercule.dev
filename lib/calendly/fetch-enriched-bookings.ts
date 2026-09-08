import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import {
  readBookingsClientCache,
  writeBookingsClientCache,
} from "@/lib/calendly/bookings-client-cache";
import { salesAudienceToLeadCategory } from "@/lib/admin/funnels/sales-audience";
import type { Audience } from "@/lib/admin/navigation";

export type FetchEnrichedBookingsResult = {
  bookings: EnrichedCalendlyBooking[];
  error: string | null;
  fromCache?: boolean;
};

export async function fetchEnrichedBookings(
  audience: Audience,
  options?: { fresh?: boolean; daysBehind?: number },
): Promise<FetchEnrichedBookingsResult> {
  const daysBehind = options?.daysBehind ?? 0;

  if (!options?.fresh) {
    const cached = readBookingsClientCache(audience, daysBehind);
    if (cached) {
      return { bookings: cached.bookings, error: null, fromCache: true };
    }
  }

  const params = new URLSearchParams({
    category: salesAudienceToLeadCategory(audience),
  });
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
  };

  if (!response.ok) {
    return {
      bookings: [],
      error: body.error ?? "Impossible de récupérer les rendez-vous",
    };
  }

  const bookings = body.bookings ?? [];
  writeBookingsClientCache(audience, bookings, daysBehind);

  return { bookings, error: null, fromCache: false };
}
