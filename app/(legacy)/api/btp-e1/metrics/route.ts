import { NextResponse } from "next/server";

import { fetchBtpE1FunnelMetrics } from "@/lib/booking/btp-e1-funnel/fetch-metrics";

/** Public aggregate funnel metrics for BTP Interested E1 (no secrets). */
export async function GET(request: Request) {
  const bypassCache =
    new URL(request.url).searchParams.get("refresh") === "1";

  try {
    const metrics = await fetchBtpE1FunnelMetrics({ bypassCache });
    return NextResponse.json(metrics);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
