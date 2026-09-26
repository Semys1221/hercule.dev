import { NextResponse } from "next/server";

import { recordBtpE1EligibilityClick } from "@/lib/booking/btp-e1-funnel/record-eligibility-click";

/** Records an anonymous click on the shared BTP Interested eligibility URL. */
export async function POST() {
  try {
    await recordBtpE1EligibilityClick();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
