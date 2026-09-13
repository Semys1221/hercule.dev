import { NextResponse } from "next/server";

import { listCalendlyEventTypes } from "@/lib/calendly/list-event-types";

export async function GET() {
  try {
    const eventTypes = await listCalendlyEventTypes();
    return NextResponse.json({ eventTypes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
