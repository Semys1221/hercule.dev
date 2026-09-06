import { NextResponse } from "next/server";
import { z } from "zod";

import { enrichBookingsForAdmin } from "@/lib/calendly/enrich-bookings";
import { listUpcomingBookings } from "@/lib/calendly/list-bookings";

const querySchema = z.object({
  daysAhead: z.coerce.number().int().min(1).max(90).optional(),
  category: z.enum(["agence", "entreprise"]).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    daysAhead: searchParams.get("daysAhead") ?? undefined,
    category: searchParams.get("category") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  try {
    const bookings = await listUpcomingBookings({
      daysAhead: parsed.data.daysAhead,
      category: parsed.data.category,
    });
    const enriched = await enrichBookingsForAdmin(bookings);
    return NextResponse.json({ bookings: enriched });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Calendly fetch failed";
    console.error("[admin/calendly/bookings]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
