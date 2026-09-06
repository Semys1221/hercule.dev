import { NextResponse } from "next/server";
import { z } from "zod";

import { loadAiReplyConfig, saveAiReplyConfig } from "@/lib/ai-reply-agent/config";

const putBodySchema = z.object({
  prompt_snapshot: z.string(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ campaignId: string }> },
) {
  const { campaignId } = await context.params;
  if (!campaignId.trim()) {
    return NextResponse.json({ error: "campaignId required" }, { status: 400 });
  }

  try {
    const config = await loadAiReplyConfig(campaignId);
    if (!config) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }
    return NextResponse.json({ config });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ campaignId: string }> },
) {
  const { campaignId } = await context.params;
  if (!campaignId.trim()) {
    return NextResponse.json({ error: "campaignId required" }, { status: 400 });
  }

  const parsed = putBodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const config = await saveAiReplyConfig(campaignId, parsed.data);
    return NextResponse.json({ ok: true, config });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
