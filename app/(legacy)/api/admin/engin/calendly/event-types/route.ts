import { NextResponse } from "next/server";

import { listAccountEventTypes } from "@/lib/clients/appointments/list-event-types";

export async function GET() {
  try {
    const eventTypes = await listAccountEventTypes();
    return NextResponse.json({ eventTypes });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list Calendly event types";
    console.error("[api/admin/engin/calendly/event-types]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
