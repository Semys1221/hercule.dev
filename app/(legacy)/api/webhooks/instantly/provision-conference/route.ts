import { NextResponse } from "next/server";

import { isInstantlyWebhookAuthorized } from "@/lib/legacy/instantly-bypass/webhook-auth";
import type { InstantlyWebhookPayload } from "@/lib/legacy/instantly-bypass/types";
import { provisionLeadsByEmails } from "@/lib/legacy/link-tracking/provision-by-emails";

/** IAS / courtiers prévoyance B2B Instantly campaign. */
const DEFAULT_IAS_CAMPAIGN_ID = "fcfbc849-508d-493a-b8a1-fb14db2f4909";
/** Scraper list Courtiers prévoyance B2B. */
const DEFAULT_IAS_LIST_ID = "016dffeb-b915-4f68-a496-c37b3108b4f3";

function iasCampaignId(): string {
  return process.env.IAS_CAMPAIGN_ID?.trim() || DEFAULT_IAS_CAMPAIGN_ID;
}

function iasListId(): string {
  return process.env.IAS_LIST_ID?.trim() || DEFAULT_IAS_LIST_ID;
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
 * Instantly email_sent → provision conference (cif) reservation links.
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

  const expectedCampaign = iasCampaignId();
  const campaignId = String(payload.campaign_id ?? "").trim();
  if (campaignId && campaignId !== expectedCampaign) {
    return NextResponse.json({
      ok: true,
      skipped: "wrong_campaign",
      campaign_id: campaignId,
    });
  }

  const email = extractLeadEmail(payload);
  if (!email) {
    return NextResponse.json({ ok: true, skipped: "missing_lead_email" });
  }

  try {
    const result = await provisionLeadsByEmails({
      emails: [email],
      listId: iasListId(),
      campaignId: expectedCampaign,
      category: "cif",
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
    console.error("[webhooks/instantly/provision-conference]", message);
    // ACK so Instantly does not disable the webhook on transient failures.
    return NextResponse.json({ ok: true, skipped: "provision_error", error: message });
  }
}
