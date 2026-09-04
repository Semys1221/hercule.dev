import { NextResponse } from "next/server";
import type { WebhookEventPayload } from "resend";

import { markJobEngagement } from "@/lib/booking-communication/jobs";
import type { BookingEmailEngagementEvent } from "@/lib/booking-communication/types";
import { getResendWebhookSecret } from "@/lib/env";
import { getResendClient } from "@/lib/resend";

const ENGAGEMENT_EVENTS: Record<string, BookingEmailEngagementEvent> = {
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.delivered": "delivered",
};

export async function POST(request: Request) {
  const secret = getResendWebhookSecret();
  if (!secret) {
    console.error("[webhooks/resend] Missing RESEND_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const payload = await request.text();
  const resend = getResendClient();

  let event: WebhookEventPayload;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: secret,
    });
  } catch (err) {
    console.error(
      "[webhooks/resend] Verification failed:",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const engagement = ENGAGEMENT_EVENTS[event.type];
  if (!engagement) {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const emailId =
    "email_id" in event.data && typeof event.data.email_id === "string"
      ? event.data.email_id.trim()
      : "";
  if (!emailId) {
    return NextResponse.json({ ok: true, ignored: "missing_email_id" });
  }

  const occurredAt = event.created_at?.trim() || new Date().toISOString();
  try {
    const updated = await markJobEngagement(emailId, engagement, occurredAt);
    return NextResponse.json({ ok: true, updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[webhooks/resend] Engagement update failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
