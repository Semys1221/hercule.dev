import { NextResponse } from "next/server";

import { runPoolRouter } from "@/lib/legacy/capacity/pool-router";
import { createCapacityClient } from "@/lib/legacy/capacity/supabase";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return false;
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
  const batchSize = Number(url.searchParams.get("batchSize") ?? "100");

  try {
    const client = createCapacityClient();
    const result = await runPoolRouter(client, {
      batchSize: Number.isFinite(batchSize) ? batchSize : 100,
      dryRun,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
