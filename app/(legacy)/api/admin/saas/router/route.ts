import { NextResponse } from "next/server";

import {
  createCapacityClient,
  listRecentRouterRuns,
} from "@/lib/legacy/capacity/supabase";

export async function GET() {
  try {
    const client = createCapacityClient();
    const runs = await listRecentRouterRuns(client, 30);
    return NextResponse.json({ runs });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
