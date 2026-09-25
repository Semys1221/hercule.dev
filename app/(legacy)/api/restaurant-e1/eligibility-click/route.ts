import { NextResponse } from "next/server";

import { recordRestaurantE1EligibilityClick } from "@/lib/booking/restaurant-e1-funnel/record-eligibility-click";

/** Records an anonymous click on the shared restaurant E1 eligibility URL. */
export async function POST() {
  try {
    await recordRestaurantE1EligibilityClick();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
