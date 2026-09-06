import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import type { Audience } from "@/lib/admin/navigation";

export async function fetchEnrichedBookings(
  audience: Audience,
  options?: { fresh?: boolean },
): Promise<{ bookings: EnrichedCalendlyBooking[]; error: string | null }> {
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

  return { bookings: body.bookings ?? [], error: null };
}
