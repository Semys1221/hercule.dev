import { NextResponse } from "next/server";

import { isWebhookBypassEnabled } from "@/lib/instantly-bypass/config";
import { handleLeadInterested } from "@/lib/instantly-bypass/handler";
import { isInstantlyWebhookAuthorized } from "@/lib/instantly-bypass/webhook-auth";

import type { InstantlyWebhookPayload } from "@/lib/instantly-bypass/types";

/** Instantly disables the webhook after repeated non-2xx responses. Ack business skips. */
const ACKNOWLEDGED_ERRORS = new Set([
  "thread_not_found",
  "missing_reservation_link",
  "template_empty",
  "missing_campaign_or_lead_email",
]);

export async function POST(request: Request) {
  if (!isInstantlyWebhookAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: InstantlyWebhookPayload;
  try {
    payload = (await request.json()) as InstantlyWebhookPayload;
  } catch {
    return NextResponse.json({ ok: true, skipped: "invalid_json" });
  }

  const eventType = payload.event_type?.trim();
  if (eventType !== "lead_interested") {
    return NextResponse.json({ ok: true, ignored: eventType ?? "unknown" });
  }

  if (!(await isWebhookBypassEnabled())) {
    return NextResponse.json({
      ok: true,
      skipped: "webhook_paused",
      message:
        "Webhook auto-send is paused globally. Re-enable instantly_bypass_settings, then the per-campaign toggle in Streamlit Setup.",
    });
  }

  try {
    const result = await handleLeadInterested(payload);
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
      latencyMs: result.latencyMs,
      replyToUuid: result.replyToUuid,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[webhooks/instantly]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
