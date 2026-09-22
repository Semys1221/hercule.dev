import { NextResponse } from "next/server";

import { getPublicConferenceSaleWindow } from "@/lib/conference/sale-window-store";
import { CONFERENCE_INSCRIPTION_MESSAGES } from "@/lib/conference/sale-window";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const window = await getPublicConferenceSaleWindow();
    return NextResponse.json(window);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "sale_window_unavailable";
    console.error("[api/conference/sale-window]", message);
    return NextResponse.json(
      {
        status: "closed",
        phase: "closed",
        checkoutOpen: false,
        inactiveMessage: CONFERENCE_INSCRIPTION_MESSAGES.closed,
        startedAt: null,
        decTaken: 0,
        courtageTaken: 0,
        error: message,
      },
      { status: 200 },
    );
  }
}
