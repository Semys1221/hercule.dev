import { NextResponse } from "next/server";

import { runRestaurantSwitch } from "@/lib/legacy/campaign-orchestrator/restaurant-switch";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return false;
  }
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${cronSecret}`) return true;
  return request.headers.get("x-cron-secret") === cronSecret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const runKey = url.searchParams.get("runKey") ?? undefined;

  try {
    const result = await runRestaurantSwitch({ dryRun, runKey });
    if (!result.ok) {
      return NextResponse.json(result, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/campaign-restaurant-switch]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const POST = GET;
