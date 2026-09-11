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
  const bookings = await listUpcomingBookings({
    daysAhead,
    daysBehind,
    niche: useLegacyCategory ? undefined : (niche as LeadCategory),
    category: useLegacyCategory ? (niche as LeadCategory) : undefined,
  });
  return enrichBookingsForAdmin(bookings);
}

function getCachedEnrichedBookings(
  daysAhead: number,
  niche: string,
  daysBehind: number,
  useLegacyCategory: boolean,
) {
  return unstable_cache(
    () => loadEnrichedBookings(daysAhead, niche, daysBehind, useLegacyCategory),
    ["admin-calendly-bookings", niche, String(daysBehind), useLegacyCategory ? "legacy" : "event"],
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
    const enriched = bypassCache
      ? await loadEnrichedBookings(daysAhead, niche, daysBehind, useLegacyCategory)
      : await getCachedEnrichedBookings(
          daysAhead,
          niche,
          daysBehind,
          useLegacyCategory,
        );

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
    console.error("[admin/calendly/bookings]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
