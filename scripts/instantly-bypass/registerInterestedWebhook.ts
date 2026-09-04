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
  patchWebhook,
  resumeWebhook,
  type InstantlyWebhookRecord,
} from "@/lib/instantly-bypass/client";
import { saveBypassConfig } from "@/lib/instantly-bypass/templates";
import { webhookSecret } from "@/lib/instantly-bypass/webhook-auth";

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

function webhookSecretFromEnv(): string {
  return webhookSecret();
}

function normalizeWebhookUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function isWebhookActive(hook: InstantlyWebhookRecord): boolean {
  return hook.status == null || hook.status === 1;
}

async function main(): Promise<void> {
  const apiKey = getInstantlyApiKey();
  const targetUrl = webhookPublicUrl();
  const campaignId = requireEnv("INSTANTLY_BYPASS_CAMPAIGN_ID");
  const secret = webhookSecretFromEnv();

  console.log(`Target webhook URL: ${targetUrl}`);
  console.log(`Campaign: ${campaignId}`);
  console.log(`Auth header: ${secret ? "Authorization Bearer (set)" : "none"}`);

  const existing = await listWebhooks(apiKey);
  const matching = existing.filter((hook) => hook.event_type === "lead_interested");

  for (const hook of matching) {
    const url = hook.target_hook_url ?? "";
    const id = hook.id?.trim();
    if (!id) continue;

    if (normalizeWebhookUrl(url) === normalizeWebhookUrl(targetUrl)) {
      console.log(`Keeping existing webhook ${id} → ${url}`);
      continue;
    }

    console.log(`Deleting lead_interested webhook ${id} → ${url}`);
    await deleteWebhook(apiKey, id);
  }

  const refreshed = await listWebhooks(apiKey);
  const existingMatch = refreshed.find(
    (hook) =>
      hook.event_type === "lead_interested" &&
      normalizeWebhookUrl(hook.target_hook_url ?? "") ===
        normalizeWebhookUrl(targetUrl) &&
      (hook.campaign === campaignId || !hook.campaign),
  );

  if (existingMatch?.id) {
    if (secret) {
      console.log(`Refreshing Authorization header on webhook ${existingMatch.id}.`);
      await patchWebhook(apiKey, existingMatch.id, {
        headers: { Authorization: `Bearer ${secret}` },
      });
    }
    if (!isWebhookActive(existingMatch)) {
      console.log(
        `Resuming inactive webhook ${existingMatch.id} (status=${existingMatch.status}).`,
      );
      await resumeWebhook(apiKey, existingMatch.id);
    } else {
      console.log("lead_interested webhook already registered on production URL.");
    }
    await saveBypassConfig({
      campaign_id: campaignId,
      webhook_id: existingMatch.id,
    });
    console.log(`Synced webhook_id ${existingMatch.id} to Supabase.`);
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

  const webhookId = created.id?.trim();
  console.log(`Registered webhook ${webhookId ?? "ok"} → ${targetUrl}`);
  if (webhookId) {
    await saveBypassConfig({
      campaign_id: campaignId,
      webhook_id: webhookId,
    });
    console.log(`Synced webhook_id ${webhookId} to Supabase.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
