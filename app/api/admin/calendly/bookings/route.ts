import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  BOOKINGS_CACHE_REVALIDATE_SECONDS,
  BOOKINGS_CACHE_TAG,
} from "@/lib/calendly/bookings-cache";
import { enrichBookingsForAdmin } from "@/lib/calendly/enrich-bookings";
import { listUpcomingBookings } from "@/lib/calendly/list-bookings";

const querySchema = z.object({
  daysAhead: z.coerce.number().int().min(1).max(90).optional(),
  daysBehind: z.coerce.number().int().min(0).max(90).optional(),
  category: z.enum(["agence", "entreprise"]).optional(),
  fresh: z.enum(["1", "true"]).optional(),
});

async function loadEnrichedBookings(
  daysAhead: number,
  category: string,
  daysBehind: number,
) {
  const bookings = await listUpcomingBookings({
    daysAhead,
    daysBehind,
    category: category === "all" ? undefined : (category as "agence" | "entreprise"),
  });
  return enrichBookingsForAdmin(bookings);
}

const getCachedEnrichedBookings = unstable_cache(
  loadEnrichedBookings,
  ["admin-calendly-bookings"],
  {
    revalidate: BOOKINGS_CACHE_REVALIDATE_SECONDS,
    tags: [BOOKINGS_CACHE_TAG],
  },
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    daysAhead: searchParams.get("daysAhead") ?? undefined,
    daysBehind: searchParams.get("daysBehind") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    fresh: searchParams.get("fresh") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const daysAhead = parsed.data.daysAhead ?? 30;
  const daysBehind = parsed.data.daysBehind ?? 0;
  const category = parsed.data.category ?? "all";
  const bypassCache = Boolean(parsed.data.fresh);

  try {
    const enriched = bypassCache
      ? await loadEnrichedBookings(daysAhead, category, daysBehind)
      : await getCachedEnrichedBookings(daysAhead, category, daysBehind);
    return NextResponse.json({ bookings: enriched, cached: !bypassCache });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Calendly fetch failed";
    console.error("[admin/calendly/bookings]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
