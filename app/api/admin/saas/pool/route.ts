import { NextResponse } from "next/server";

import { SAAS_CAPACITY } from "@/lib/capacity/constants";
import {
  countPoolByNiche,
  createCapacityClient,
} from "@/lib/capacity/supabase";

export async function GET() {
  try {
    const client = createCapacityClient();
    const available = await countPoolByNiche(client);

    const statusCounts: Record<string, number> = {};
    for (const status of [
      "available",
      "assigned",
      "in_sequence",
      "booked",
      "exhausted",
      "cooloff",
    ]) {
      const { count, error } = await client
        .from("prospect_pool")
        .select("id", { count: "exact", head: true })
        .eq("status", status);
      if (error) throw new Error(error.message);
      statusCounts[status] = count ?? 0;
    }

    return NextResponse.json({
      available,
      statusCounts,
      alertThreshold: SAAS_CAPACITY.poolAlertThreshold,
      targetPerNiche: SAAS_CAPACITY.poolTargetPerNiche,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
