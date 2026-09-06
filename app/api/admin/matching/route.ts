import { NextResponse } from "next/server";
import { z } from "zod";

import { createMatchAndPropose } from "@/lib/matching/orchestrator";
import { listMatches } from "@/lib/matching/store";

const postSchema = z.object({
  agenceId: z.string().min(1),
  entrepriseId: z.string().min(1),
});

export async function GET() {
  try {
    const matches = await listMatches();
    return NextResponse.json({ matches });
  } catch (error) {
    const message = error instanceof Error ? error.message : "matching list failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const match = await createMatchAndPropose(parsed.data);
    return NextResponse.json({ matchId: match.id, match });
  } catch (error) {
    const message = error instanceof Error ? error.message : "matching failed";
    console.error("[admin/matching]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
