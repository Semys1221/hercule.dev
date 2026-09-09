import { NextResponse } from "next/server";

import { listEnabledVariableTokens } from "@/lib/admin/niches/sequence-variables";
import { isNiche } from "@/lib/admin/navigation";

export async function GET(
  _request: Request,
  context: { params: Promise<{ niche: string }> },
) {
  const { niche: rawNiche } = await context.params;
  if (!isNiche(rawNiche)) {
    return NextResponse.json({ error: "Invalid niche" }, { status: 400 });
  }

  try {
    const variables = await listEnabledVariableTokens(rawNiche);
    return NextResponse.json({ niche: rawNiche, variables });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
