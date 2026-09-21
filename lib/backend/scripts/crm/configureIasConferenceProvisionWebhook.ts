/**
 * Register Instantly email_sent webhook → provision conference links for IAS campaign.
 *
 * Usage:
 *   pnpm configure-ias-conference-provision-webhook
 */
import {
  createWebhook,
  listWebhooks,
  patchWebhook,
  resumeWebhook,
  type InstantlyWebhookRecord,
} from "@/lib/legacy/instantly-bypass/client";
import { getInstantlyApiKey } from "@/lib/instantly";
import { webhookSecret } from "@/lib/legacy/instantly-bypass/webhook-auth";

const IAS_CAMPAIGN_ID =
  process.env.IAS_CAMPAIGN_ID?.trim() ||
  "fcfbc849-508d-493a-b8a1-fb14db2f4909";

const WEBHOOK_NAME = "Hercule IAS conference provision (email_sent)";
const EVENT_TYPE = "email_sent";

function publicWebhookUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (appUrl && appUrl.startsWith("https://") && !appUrl.includes("localhost")) {
    return `${appUrl}/api/webhooks/instantly/provision-conference`;
  }
  return "https://www.hercule.dev/api/webhooks/instantly/provision-conference";
}

function isWebhookActive(hook: InstantlyWebhookRecord): boolean {
  // Instantly: 1 = active, 0 = paused/disabled (also accept string forms).
  const status = hook.status;
  if (status === null || status === undefined) return true;
  if (typeof status === "number") return status === 1;
  const normalized = String(status).toLowerCase();
  return normalized === "active" || normalized === "1" || normalized === "enabled";
}

function matchesIasProvisionWebhook(hook: InstantlyWebhookRecord, targetUrl: string): boolean {
  const url = String(hook.target_hook_url ?? "").trim();
  const campaign = String(hook.campaign ?? "").trim();
  const eventType = String(hook.event_type ?? "").trim();
  return (
    url === targetUrl &&
    campaign === IAS_CAMPAIGN_ID &&
    eventType === EVENT_TYPE
  );
}

async function main(): Promise<void> {
  const apiKey = getInstantlyApiKey();
  const secret = webhookSecret();
  if (!secret) {
    throw new Error(
      "Set INSTANTLY_BYPASS_WEBHOOK_SECRET (or CRON_SECRET) before configuring the webhook.",
    );
  }

  const targetUrl = publicWebhookUrl();
  const authHeaders = { Authorization: `Bearer ${secret}` };

  const existing = await listWebhooks(apiKey);
  const match = existing.find((hook) => matchesIasProvisionWebhook(hook, targetUrl));

  let webhook: InstantlyWebhookRecord;
  if (match?.id) {
    webhook = await patchWebhook(apiKey, match.id, {
      headers: authHeaders,
      name: WEBHOOK_NAME,
      target_hook_url: targetUrl,
    });
    if (!isWebhookActive(match)) {
      webhook = await resumeWebhook(apiKey, match.id);
    }
    console.log(
      JSON.stringify(
        {
          action: "updated",
          id: webhook.id ?? match.id,
          campaign: IAS_CAMPAIGN_ID,
          event_type: EVENT_TYPE,
          target_hook_url: targetUrl,
        },
        null,
        2,
      ),
    );
    return;
  }

  webhook = await createWebhook(apiKey, {
    target_hook_url: targetUrl,
    event_type: EVENT_TYPE,
    name: WEBHOOK_NAME.slice(0, 80),
    campaign: IAS_CAMPAIGN_ID,
    headers: authHeaders,
  });

  console.log(
    JSON.stringify(
      {
        action: "created",
        id: webhook.id,
        campaign: IAS_CAMPAIGN_ID,
        event_type: EVENT_TYPE,
        target_hook_url: targetUrl,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
