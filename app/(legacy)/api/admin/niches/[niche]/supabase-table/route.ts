import { NextResponse } from "next/server";

import { getSupabaseTableStatus } from "@/lib/legacy/admin/niches/supabase-table-status";
import { isNiche } from "@/lib/legacy/admin/navigation";

export async function GET(
  _request: Request,
  context: { params: Promise<{ niche: string }> },
) {
  const { niche: rawNiche } = await context.params;
  if (!isNiche(rawNiche)) {
    return NextResponse.json({ error: "Invalid niche" }, { status: 400 });
  }

  try {
    const status = await getSupabaseTableStatus(rawNiche);
    return NextResponse.json({ status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
