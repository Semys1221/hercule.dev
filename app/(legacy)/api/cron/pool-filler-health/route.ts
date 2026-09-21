import { NextResponse } from "next/server";

import {
  SAAS_CAPACITY,
  SAAS_NICHES,
} from "@/lib/legacy/capacity/constants";
import {
  countPoolByNiche,
  createCapacityClient,
} from "@/lib/legacy/capacity/supabase";

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
    const counts = await countPoolByNiche(client);
    const alerts = SAAS_NICHES.filter(
      (niche) => counts[niche] < SAAS_CAPACITY.poolAlertThreshold,
    ).map((niche) => ({
      niche,
      available: counts[niche],
      threshold: SAAS_CAPACITY.poolAlertThreshold,
      target: SAAS_CAPACITY.poolTargetPerNiche,
    }));

    return NextResponse.json({
      ok: true,
      counts,
      alerts,
      healthy: alerts.length === 0,
    });
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
