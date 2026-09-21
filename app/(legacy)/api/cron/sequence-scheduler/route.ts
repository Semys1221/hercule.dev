import { NextResponse } from "next/server";

import { runSequenceScheduler } from "@/lib/legacy/capacity/sequence-scheduler";
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

  try {
    const client = createCapacityClient();
    const result = await runSequenceScheduler(client);
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
