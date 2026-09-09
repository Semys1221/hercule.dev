import { NextResponse } from "next/server";

import { isNiche } from "@/lib/admin/navigation";
import { buildVariableStatusSnapshot } from "@/lib/admin/niches/verify-email-variables";

export async function GET(
  _request: Request,
  context: { params: Promise<{ niche: string }> },
) {
  const { niche: rawNiche } = await context.params;
  if (!isNiche(rawNiche)) {
    return NextResponse.json({ error: "Invalid niche" }, { status: 400 });
  }

  try {
    const snapshot = await buildVariableStatusSnapshot(rawNiche);
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Status load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
