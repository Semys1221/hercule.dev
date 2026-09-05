import { NextResponse } from "next/server";

import {
  getAvailabilitySummary,
  parseBookingEvent,
} from "@/lib/calendly/availability";

const CACHE_CONTROL = "public, s-maxage=180, stale-while-revalidate=300";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const event = parseBookingEvent(searchParams.get("event"));

  if (!event) {
    return NextResponse.json(
      { ok: false, reason: "invalid_event" },
      { status: 400 },
    );
  }

  try {
    const summary = await getAvailabilitySummary(event);
    return NextResponse.json(summary, {
      headers: {
        "Cache-Control": CACHE_CONTROL,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[calendly/availability]", message);
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
