import { NextResponse } from "next/server";

import { isInstantlyWebhookAuthorized } from "@/lib/ai-reply-agent/auth";
import { isHandledReplyAgentEvent } from "@/lib/ai-reply-agent/events";
import { handleInstantlyReply } from "@/lib/ai-reply-agent/handler";

import type { InstantlyReplyWebhookPayload } from "@/lib/ai-reply-agent/types";

const ACKNOWLEDGED_ERRORS = new Set(["thread_not_found"]);

export async function POST(request: Request) {
  if (!isInstantlyWebhookAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: InstantlyReplyWebhookPayload;
  try {
    payload = (await request.json()) as InstantlyReplyWebhookPayload;
  } catch {
    return NextResponse.json({ ok: true, skipped: "invalid_json" });
  }

  const eventType = payload.event_type?.trim() ?? "";
  if (!isHandledReplyAgentEvent(eventType)) {
    return NextResponse.json({ ok: true, ignored: eventType || "unknown" });
  }

  try {
    const result = await handleInstantlyReply(payload);
    if (!result.ok) {
      if (result.error && ACKNOWLEDGED_ERRORS.has(result.error)) {
        return NextResponse.json({ ok: true, skipped: result.error });
      }
      return NextResponse.json(
        { ok: false, error: result.error, skipped: result.skipped },
        { status: 500 },
      );
    }
    return NextResponse.json({
      ok: true,
      skipped: result.skipped,
      aiStatus: result.aiStatus,
      latencyMs: result.latencyMs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[webhooks/instantly/reply]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
