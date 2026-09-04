/**
 * Register (or re-register) the Instantly lead_interested webhook on production.
 *
 * Usage:
 *   pnpm register-instantly-interested-webhook
 *   INSTANTLY_BYPASS_CAMPAIGN_ID=<uuid> pnpm register-instantly-interested-webhook
 */

import {
  createWebhook,
  deleteWebhook,
  getInstantlyApiKey,
  listWebhooks,
} from "@/lib/instantly-bypass/client";

const PRODUCTION_WEBHOOK_PATH = "/api/webhooks/instantly";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function webhookPublicUrl(): string {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://www.hercule.dev"
  ).replace(/\/$/, "");
  return `${base}${PRODUCTION_WEBHOOK_PATH}`;
}

function webhookSecret(): string {
  return (
    process.env.INSTANTLY_BYPASS_WEBHOOK_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    ""
  );
}

async function main(): Promise<void> {
  const apiKey = getInstantlyApiKey();
  const targetUrl = webhookPublicUrl();
  const campaignId = requireEnv("INSTANTLY_BYPASS_CAMPAIGN_ID");
  const secret = webhookSecret();

  console.log(`Target webhook URL: ${targetUrl}`);
  console.log(`Campaign: ${campaignId}`);
  console.log(`Auth header: ${secret ? "Authorization Bearer (set)" : "none"}`);

  const existing = await listWebhooks(apiKey);
  const matching = existing.filter((hook) => hook.event_type === "lead_interested");

  for (const hook of matching) {
    const url = hook.target_hook_url ?? "";
    const id = hook.id?.trim();
    if (!id) continue;

    if (url.replace(/\/$/, "") === targetUrl.replace(/\/$/, "")) {
      console.log(`Keeping existing webhook ${id} → ${url}`);
      continue;
    }

    console.log(`Deleting lead_interested webhook ${id} → ${url}`);
    await deleteWebhook(apiKey, id);
  }

  const refreshed = await listWebhooks(apiKey);
  const alreadyRegistered = refreshed.some(
    (hook) =>
      hook.event_type === "lead_interested" &&
      (hook.target_hook_url ?? "").replace(/\/$/, "") ===
        targetUrl.replace(/\/$/, "") &&
      (hook.campaign === campaignId || !hook.campaign),
  );

  if (alreadyRegistered) {
    console.log("lead_interested webhook already registered on production URL.");
    return;
  }

  const headers = secret ? { Authorization: `Bearer ${secret}` } : undefined;
  const created = await createWebhook(apiKey, {
    target_hook_url: targetUrl,
    event_type: "lead_interested",
    name: "Hercule Interested Bypass",
    campaign: campaignId,
    headers,
  });

  console.log(`Registered webhook ${created.id ?? "ok"} → ${targetUrl}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
