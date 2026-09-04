/**
 * Smoke test: POST a synthetic lead_interested payload to the bypass webhook.
 *
 * Usage:
 *   pnpm smoke-instantly-bypass-webhook
 *   WEBHOOK_BASE_URL=http://localhost:3000 pnpm smoke-instantly-bypass-webhook
 *
 * With INSTANTLY_BYPASS_WEBHOOK_ENABLED unset/false, expect skipped: "webhook_paused".
 */

const baseUrl = (
  process.env.WEBHOOK_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  "http://localhost:3000"
).replace(/\/$/, "");

const secret =
  process.env.INSTANTLY_BYPASS_WEBHOOK_SECRET?.trim() ||
  process.env.CRON_SECRET?.trim() ||
  "";

const campaignId = process.env.INSTANTLY_BYPASS_CAMPAIGN_ID?.trim();
const leadEmail = process.env.SMOKE_LEAD_EMAIL?.trim() || "smoke-test@example.com";

async function runSmokeInterestedWebhook(): Promise<void> {
  const payload = {
    timestamp: new Date().toISOString(),
    event_type: "lead_interested",
    workspace: "00000000-0000-0000-0000-000000000001",
    campaign_id: campaignId ?? "00000000-0000-0000-0000-000000000002",
    campaign_name: "Smoke Test Campaign",
    lead_email: leadEmail,
    email_account: process.env.SMOKE_EACCOUNT?.trim() || "sender@example.com",
    first_name: "Smoke",
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  const url = `${baseUrl}/api/webhooks/instantly`;
  console.log(`POST ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  console.log(`Status: ${response.status}`);
  console.log(text);

  if (!response.ok) {
    process.exitCode = 1;
  }
}

runSmokeInterestedWebhook().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
