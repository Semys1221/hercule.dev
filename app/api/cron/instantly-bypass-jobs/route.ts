import { NextResponse } from "next/server";

import { dispatchDueBypassJobs } from "@/lib/instantly-bypass/dispatch-scheduled";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return true;
  }
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${cronSecret}`) return true;
  return request.headers.get("x-cron-secret") === cronSecret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await dispatchDueBypassJobs();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/instantly-bypass-jobs]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = GET;
