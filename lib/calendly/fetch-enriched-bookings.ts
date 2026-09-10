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
      let outreach = cached.outreach;
      if (!outreach) {
        const outreachResponse = await fetch(`/api/admin/niches/${niche}/outreach-config`);
        const outreachBody = (await outreachResponse.json()) as {
          config?: {
            calendly_configured?: boolean;
            campaign_linked?: boolean;
          };
        };
        if (outreachResponse.ok && outreachBody.config) {
          outreach = {
            calendly_configured: outreachBody.config.calendly_configured,
            campaign_linked: outreachBody.config.campaign_linked,
          };
          writeBookingsClientCache(
            niche,
            cached.bookings,
            daysBehind,
            cached.fetchedAt,
            undefined,
            outreach,
          );
        }
      }
      // #region agent log
      fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "9da3c4",
        },
        body: JSON.stringify({
          sessionId: "9da3c4",
          runId: "post-fix",
          hypothesisId: "B",
          location: "fetch-enriched-bookings.ts:client-cache-hit",
          message: "bookings client cache hit",
          data: {
            niche,
            bookingsCount: cached.bookings.length,
            hasOutreachInCache: Boolean(outreach),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return {
        bookings: cached.bookings,
        error: null,
        fromCache: true,
        calendlyConfigured: outreach?.calendly_configured,
        campaignLinked: outreach?.campaign_linked,
      };
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
  writeBookingsClientCache(niche, bookings, daysBehind, Date.now(), undefined, body.outreach);

  return {
    bookings,
    error: null,
    fromCache: false,
    calendlyConfigured: body.outreach?.calendly_configured,
    campaignLinked: body.outreach?.campaign_linked,
  };
}
