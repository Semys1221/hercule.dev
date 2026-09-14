import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  BOOKINGS_CACHE_REVALIDATE_SECONDS,
  bookingsCacheTag,
} from "@/lib/calendly/bookings-cache-constants";
import { enrichBookingsForAdmin } from "@/lib/calendly/enrich-bookings";
import { listUpcomingBookings } from "@/lib/calendly/list-bookings";
import { getOutreachConfigView } from "@/lib/admin/niches/outreach-config";
import { isNiche } from "@/lib/admin/navigation";
import type { LeadCategory } from "@/lib/link-tracking/types";

const querySchema = z.object({
  daysAhead: z.coerce.number().int().min(1).max(90).optional(),
  daysBehind: z.coerce.number().int().min(0).max(90).optional(),
  niche: z.enum(["agence", "entreprise", "comptable", "cif"]).optional(),
  /** @deprecated Use niche — kept for rendez-vous panel during transition */
  category: z.enum(["agence", "entreprise", "comptable", "cif"]).optional(),
  fresh: z.enum(["1", "true"]).optional(),
});

async function loadEnrichedBookings(
  daysAhead: number,
  niche: string,
  daysBehind: number,
  useLegacyCategory: boolean,
) {
  const pipelineStartedAt = Date.now();
  const listStartedAt = Date.now();
  const bookings = await listUpcomingBookings({
    daysAhead,
    daysBehind,
    niche: useLegacyCategory ? undefined : (niche as LeadCategory),
    category: useLegacyCategory ? (niche as LeadCategory) : undefined,
  });
  const listDurationMs = Date.now() - listStartedAt;
  const enrichStartedAt = Date.now();
  const enriched = await enrichBookingsForAdmin(bookings);
  const enrichDurationMs = Date.now() - enrichStartedAt;
  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "2ea86d" },
    body: JSON.stringify({
      sessionId: "2ea86d",
      runId: "pre-fix",
      hypothesisId: "H1-H3",
      location: "bookings/route.ts:loadEnrichedBookings",
      message: "Bookings pipeline timings",
      data: {
        niche,
        daysBehind,
        useLegacyCategory,
        rawCount: bookings.length,
        enrichedCount: enriched.length,
        listDurationMs,
        enrichDurationMs,
        totalDurationMs: Date.now() - pipelineStartedAt,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  return enriched;
}

function eventTypeCacheSegment(uri: string | null | undefined): string {
  if (!uri?.trim()) {
    return "none";
  }
  return uri.replace(/\/$/, "").split("/").pop() ?? "none";
}

function getCachedEnrichedBookings(
  daysAhead: number,
  niche: string,
  daysBehind: number,
  useLegacyCategory: boolean,
  eventTypeUri: string | null,
) {
  return unstable_cache(
    () => loadEnrichedBookings(daysAhead, niche, daysBehind, useLegacyCategory),
    [
      "admin-calendly-bookings",
      "event-v2",
      niche,
      String(daysBehind),
      useLegacyCategory ? "legacy" : "event",
      eventTypeCacheSegment(eventTypeUri),
    ],
    {
      revalidate: BOOKINGS_CACHE_REVALIDATE_SECONDS,
      tags: [bookingsCacheTag(niche)],
    },
  )();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    daysAhead: searchParams.get("daysAhead") ?? undefined,
    daysBehind: searchParams.get("daysBehind") ?? undefined,
    niche: searchParams.get("niche") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    fresh: searchParams.get("fresh") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const daysAhead = parsed.data.daysAhead ?? 30;
  const daysBehind = parsed.data.daysBehind ?? 0;
  const niche = parsed.data.niche ?? parsed.data.category;
  const bypassCache = Boolean(parsed.data.fresh);
  const useLegacyCategory = Boolean(parsed.data.category && !parsed.data.niche);

  if (!niche || !isNiche(niche)) {
    return NextResponse.json(
      { error: "Query parameter niche is required" },
      { status: 400 },
    );
  }

  try {
    const outreach = await getOutreachConfigView(niche);

    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d17331" },
      body: JSON.stringify({
        sessionId: "d17331",
        runId: "pre-fix",
        hypothesisId: "H1",
        location: "bookings/route.ts:GET",
        message: "Admin bookings request",
        data: {
          niche,
          daysBehind,
          useLegacyCategory,
          bypassCache,
          resolvedEventTypeUri: outreach.resolved_calendly_event_type_uri,
          calendlyConfigured: outreach.calendly_configured,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    const enriched = bypassCache
      ? await loadEnrichedBookings(daysAhead, niche, daysBehind, useLegacyCategory)
      : await getCachedEnrichedBookings(
          daysAhead,
          niche,
          daysBehind,
          useLegacyCategory,
          outreach.resolved_calendly_event_type_uri,
        );

    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d17331" },
      body: JSON.stringify({
        sessionId: "d17331",
        runId: "post-fix",
        hypothesisId: "H2",
        location: "bookings/route.ts:GET:response",
        message: "Admin bookings response ready",
        data: {
          niche,
          bypassCache,
          resolvedEventTypeUri: outreach.resolved_calendly_event_type_uri,
          bookingsCount: enriched.length,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json({
      bookings: enriched,
      cached: !bypassCache,
      outreach: {
        calendly_configured: outreach.calendly_configured,
        campaign_linked: outreach.campaign_linked,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Calendly fetch failed";
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "2ea86d" },
      body: JSON.stringify({
        sessionId: "2ea86d",
        runId: "pre-fix",
        hypothesisId: "H2-H4",
        location: "bookings/route.ts:GET:error",
        message: "Admin bookings handler error",
        data: { niche, daysBehind, useLegacyCategory, bypassCache, error: message },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    console.error("[admin/calendly/bookings]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
