/**
 * Hit production reply webhook with gscredits-like payload.
 *
 * Usage:
 *   tsx --env-file=.env ./scripts/ai-reply-agent/verifyE1ReplyGateProdWebhook.ts
 */

import { randomBytes } from "node:crypto";

const DEFAULT_CAMPAIGN_ID = "e3bdb573-fe9f-437d-bd96-4ceb52869dd4";
const DEFAULT_LEAD_EMAIL = "contact@gscredits.net";
const GSCREDITS_INBOUND_AT = "2026-09-18T06:53:39.000Z";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function baseUrl(): string {
  return (
    process.env.WEBHOOK_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://www.hercule.dev"
  ).replace(/\/$/, "");
}

function webhookSecret(): string {
  return (
    process.env.INSTANTLY_BYPASS_WEBHOOK_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    ""
  );
}

async function main(): Promise<void> {
  const secret = webhookSecret();
  if (!secret) {
    throw new Error("Missing INSTANTLY_BYPASS_WEBHOOK_SECRET or CRON_SECRET");
  }

  const campaignId =
    process.env.VERIFY_CAMPAIGN_ID?.trim() || DEFAULT_CAMPAIGN_ID;
  const leadEmail =
    process.env.VERIFY_LEAD_EMAIL?.trim().toLowerCase() || DEFAULT_LEAD_EMAIL;
  const smokeEmailId = `verify-prod-e1-gate-${randomBytes(8).toString("hex")}`;

  const payload = {
    timestamp: GSCREDITS_INBOUND_AT,
    event_type: "reply_received",
    campaign_id: campaignId,
    lead_email: leadEmail,
    email_account: "beatrice@socle-conseil.site",
    email_id: smokeEmailId,
    reply_subject: "Re: question clients",
    reply_text: "Vous pouvez.",
  };

  const response = await fetch(`${baseUrl()}/api/webhooks/instantly/reply`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as {
    ok?: boolean;
    skipped?: string;
    aiStatus?: string;
    error?: string;
  };

  console.log("prod webhook:", {
    status: response.status,
    ok: body.ok ?? null,
    skipped: body.skipped ?? null,
    aiStatus: body.aiStatus ?? null,
    error: body.error ?? null,
    deploymentBaseUrl: baseUrl(),
  });

  if (!response.ok || body.aiStatus !== "skipped_waiting_e1") {
    throw new Error(
      `Production webhook verification failed: status=${response.status} body=${JSON.stringify(body)}`,
    );
  }

  console.log("PROD WEBHOOK VERIFY PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
