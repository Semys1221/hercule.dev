import { NextResponse } from "next/server";
import { z } from "zod";

import { runDeliveranceAction } from "@/lib/deliverance/orchestrator";

const bodySchema = z.object({
  action: z.enum(["search_started", "milestone", "waitlist"]),
});

type RouteParams = {
  params: Promise<{ matchId: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { matchId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    await runDeliveranceAction({ matchId, action: parsed.data.action });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "deliverance failed";
    console.error("[admin/deliverance]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
