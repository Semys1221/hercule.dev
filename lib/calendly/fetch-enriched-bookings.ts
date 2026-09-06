import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import type { Audience } from "@/lib/admin/navigation";

export async function fetchEnrichedBookings(
  audience: Audience,
): Promise<{ bookings: EnrichedCalendlyBooking[]; error: string | null }> {
  const params = new URLSearchParams({ category: audience });
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
