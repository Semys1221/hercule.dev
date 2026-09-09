import { NextResponse } from "next/server";

import {
  findNextAvailableSlots,
  formatFrenchSlotLabel,
  parseBookingEvent,
} from "@/lib/calendly/availability";

const CACHE_CONTROL = "public, s-maxage=180, stale-while-revalidate=300";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const event = parseBookingEvent(searchParams.get("event"));
  const countRaw = Number.parseInt(searchParams.get("count") ?? "2", 10);
  const count = Number.isFinite(countRaw)
    ? Math.max(1, Math.min(countRaw, 5))
    : 2;

  if (!event) {
    return NextResponse.json(
      { ok: false, reason: "invalid_event" },
      { status: 400 },
    );
  }

  try {
    const slots = await findNextAvailableSlots(event, count);
    return NextResponse.json(
      {
        ok: true,
        slots: slots.map((start) => ({
          iso: start.toISOString(),
          label: formatFrenchSlotLabel(start),
        })),
      },
      {
        headers: {
          "Cache-Control": CACHE_CONTROL,
        },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[calendly/next-slots]", message);
    return NextResponse.json(
      { ok: false, reason: message },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
