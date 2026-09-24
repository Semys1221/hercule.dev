import { NextResponse } from "next/server";

import { getJumVertical } from "@/lib/legacy/admin/niches/jum-verticals";
import { isInstantlyWebhookAuthorized } from "@/lib/legacy/instantly-bypass/webhook-auth";
import type { InstantlyWebhookPayload } from "@/lib/legacy/instantly-bypass/types";
import { provisionLeadsByEmails } from "@/lib/legacy/link-tracking/provision-by-emails";

const vertical = getJumVertical("avocat");

function campaignId(): string {
  return (
    process.env.AVOCATS_CAMPAIGN_ID?.trim() || vertical.campaignId
  );
}

function listId(): string {
  return process.env.AVOCATS_LIST_ID?.trim() || vertical.listId;
}

function extractLeadEmail(payload: InstantlyWebhookPayload): string | null {
  const raw =
    payload.lead_email ||
    (typeof payload.email === "string" ? payload.email : "") ||
    (typeof payload.lead === "string" ? payload.lead : "");
  const email = String(raw || "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) return null;
  return email;
}

/**
 * Instantly email_sent → provision JUM reservation links for avocats.
 * Always ACK business skips with HTTP 200 so Instantly does not disable the hook.
 */
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

  const eventType = payload.event_type?.trim() || "";
  if (eventType !== "email_sent") {
    return NextResponse.json({ ok: true, ignored: eventType || "unknown" });
  }

  const expectedCampaign = campaignId();
  const campaign = String(payload.campaign_id ?? "").trim();
  if (campaign && campaign !== expectedCampaign) {
    return NextResponse.json({
      ok: true,
      skipped: "wrong_campaign",
      campaign_id: campaign,
    });
  }

  const email = extractLeadEmail(payload);
  if (!email) {
    return NextResponse.json({ ok: true, skipped: "missing_lead_email" });
  }

  try {
    const result = await provisionLeadsByEmails({
      emails: [email],
      listId: listId(),
      campaignId: expectedCampaign,
      category: "comptable_delivery",
      jumSegment: vertical.segment,
    });
    return NextResponse.json({
      ok: true,
      email,
      created: result.created,
      updated: result.updated,
      patched: result.patched,
      skipped: result.skipped,
      failed: result.failed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "provision_failed";
    console.error("[webhooks/instantly/provision-jum-avocat]", message);
    return NextResponse.json({
      ok: true,
      skipped: "provision_error",
      error: message,
    });
  }
}
