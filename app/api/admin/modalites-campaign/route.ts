import { NextResponse } from "next/server";
import { z } from "zod";

import { runModalitesCampaign } from "@/lib/modalites-campaign/send";

const postSchema = z.object({
  mode: z.enum(["dry_run", "test_send", "send_one", "send_all"]),
  leadId: z.string().uuid().optional(),
  testTo: z.string().email().optional(),
  confirmPhrase: z.string().optional(),
});

export async function GET() {
  try {
    const result = await runModalitesCampaign({ mode: "dry_run" });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "modalites campaign list failed";
    console.error("[admin/modalites-campaign GET]", message);
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
    const result = await runModalitesCampaign(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "modalites campaign send failed";
    console.error("[admin/modalites-campaign POST]", message);
    const status =
      message === "confirm_phrase_required" ||
      message === "testTo email required" ||
      message === "lead_not_eligible" ||
      message === "no_eligible_lead"
        ? 422
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
