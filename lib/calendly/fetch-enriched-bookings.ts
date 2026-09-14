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
    const startedAt = Date.now();
    const response = await fetch(`/api/admin/calendly/bookings?${params.toString()}`);
    const contentType = response.headers.get("content-type") ?? "";
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
      // #region agent log
      fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "2ea86d" },
        body: JSON.stringify({
          sessionId: "2ea86d",
          runId: "pre-fix",
          hypothesisId: "H4",
          location: "fetch-enriched-bookings.ts:json-parse-failed",
          message: "Bookings API response is not JSON",
          data: {
            niche,
            status: response.status,
            statusText: response.statusText,
            contentType,
            durationMs: Date.now() - startedAt,
            rawSnippet: rawText.slice(0, 200),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return {
        bookings: [],
        error: rawText.trim() || response.statusText || "Impossible de récupérer les rendez-vous",
      };
    }
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "2ea86d" },
      body: JSON.stringify({
        sessionId: "2ea86d",
        runId: "pre-fix",
        hypothesisId: "H1-H5",
        location: "fetch-enriched-bookings.ts:response",
        message: "Bookings API response received",
        data: {
          niche,
          fresh: options?.fresh ?? false,
          daysBehind,
          ok: response.ok,
          status: response.status,
          durationMs: Date.now() - startedAt,
          bookingsCount: body.bookings?.length ?? 0,
          error: body.error ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
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
