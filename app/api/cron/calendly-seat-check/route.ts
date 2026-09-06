import { NextResponse } from "next/server";

import { checkCalendlySeatWorkflows } from "@/lib/calendly-seat-onboarding/orchestrator";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return true;
  }
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${cronSecret}`) return true;
  return request.headers.get("x-cron-secret") === cronSecret;
}

function parseDryRun(request: Request): boolean {
  const url = new URL(request.url);
  return url.searchParams.get("dryRun") === "1" || url.searchParams.get("dry_run") === "1";
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await checkCalendlySeatWorkflows({ dryRun: parseDryRun(request) });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/calendly-seat-check]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = GET;
