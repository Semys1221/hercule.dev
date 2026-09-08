/**
 * E2E smoke: cabinets_expertise_comptable (entreprise) production flow.
 *
 * Usage:
 *   pnpm smoke-comptable-flow-e2e --dry-run
 *   pnpm smoke-comptable-flow-e2e --execute
 *   pnpm smoke-comptable-flow-e2e --execute --prepare
 *   pnpm smoke-comptable-flow-e2e --execute --prepare --keep
 *
 * Optional env:
 *   WEBHOOK_BASE_URL          default NEXT_PUBLIC_APP_URL or https://www.hercule.dev
 *   SMOKE_LEAD_EMAIL          use existing lead (recommended for --execute sends)
 *   COMPTABLE_LIST_ID         default comptable list UUID
 *   COMPTABLE_CAMPAIGN_ID     default comptable campaign UUID
 *   SMOKE_EACCOUNT            Instantly sender for webhooks
 *
 * Requires in .env:
 *   INSTANTLY_API_KEY, CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL
 */

import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";

import { REPLY_WEBHOOK_EVENT } from "@/lib/ai-reply-agent/events";
import {
  findLeadByEmailInCampaign,
  getInstantlyApiKey,
  listEmails,
  updateLeadInterestStatusBypass,
} from "@/lib/instantly-bypass/client";
import {
  flowIdempotencyKey,
  interestedIdempotencyKey,
} from "@/lib/instantly-bypass/jobs";
import { createBypassClient } from "@/lib/instantly-bypass/supabase";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import { instantlyFetch } from "@/lib/instantly";

import type { InstantlyWebhookPayload } from "@/lib/instantly-bypass/types";

const EXECUTE = process.argv.includes("--execute");
const DRY_RUN = process.argv.includes("--dry-run") || !EXECUTE;
const PREPARE = process.argv.includes("--prepare");
const KEEP = process.argv.includes("--keep");

const DEFAULT_LIST_ID = "edfd3090-6306-4f71-bd83-01192b06666c";
const DEFAULT_CAMPAIGN_ID = "e4c58718-ca00-4e27-b714-68e522fe4db6";
const DEFAULT_CATEGORY = "entreprise";

const INTERESTED_STATUS = 1;

type StageResult = {
  stage: string;
  ok: boolean;
  detail: string;
};

type WebhookResponse = {
  ok?: boolean;
  skipped?: string;
  error?: string;
  aiStatus?: string;
};

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

function cronSecret(): string {
  return (
    process.env.INSTANTLY_BYPASS_WEBHOOK_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    ""
  );
}

function listId(): string {
  return process.env.COMPTABLE_LIST_ID?.trim() || DEFAULT_LIST_ID;
}

function campaignId(): string {
  return process.env.COMPTABLE_CAMPAIGN_ID?.trim() || DEFAULT_CAMPAIGN_ID;
}

function buildLeadEmail(): string {
  const existing = process.env.SMOKE_LEAD_EMAIL?.trim().toLowerCase();
  if (existing) return existing;
  const runId = randomBytes(4).toString("hex");
  return `comptable-flow-${runId}@smoke.hercule.dev`;
}

function buildMockLead(email: string) {
  return {
    email,
    first_name: "Smoke",
    last_name: "Comptable",
    company_name: "Cabinet Test E2E",
  };
}

async function pushLeadsToList(
  listIdValue: string,
  leads: Array<Record<string, string>>,
): Promise<{ pushed: number; skipped: number; failed: number }> {
  const apiKey = getInstantlyApiKey();
  const data = await instantlyFetch<{
    leads_uploaded?: number;
    skipped_count?: number;
  }>(apiKey, "/leads/add", {
    method: "POST",
    body: JSON.stringify({
      list_id: listIdValue,
      leads,
      skip_if_in_campaign: true,
      skip_if_in_list: false,
    }),
  });

  const pushed = Number(data.leads_uploaded ?? 0);
  const skipped = Number(data.skipped_count ?? 0);
  return {
    pushed,
    skipped,
    failed: Math.max(leads.length - pushed - skipped, 0),
  };
}

async function pushLeadsToCampaign(
  campaignIdValue: string,
  leads: Array<Record<string, string>>,
): Promise<{ pushed: number; skipped: number; failed: number }> {
  const apiKey = getInstantlyApiKey();
  const data = await instantlyFetch<{
    leads_uploaded?: number;
    skipped_count?: number;
  }>(apiKey, "/leads/add", {
    method: "POST",
    body: JSON.stringify({
      campaign_id: campaignIdValue,
      leads,
      skip_if_in_workspace: false,
    }),
  });

  const pushed = Number(data.leads_uploaded ?? 0);
  const skipped = Number(data.skipped_count ?? 0);
  return {
    pushed,
    skipped,
    failed: Math.max(leads.length - pushed - skipped, 0),
  };
}

function runProvisionForEmail(email: string, dryRun: boolean): Record<string, unknown> {
  const args = [
    "python3",
    "./scripts/crm/provisionListLinks.py",
    "--list-id",
    listId(),
    "--campaign-id",
    campaignId(),
    "--category",
    DEFAULT_CATEGORY,
    "--email",
    email,
  ];
  if (dryRun) args.push("--dry-run");

  const output = execSync(args.join(" "), {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
  });
  return JSON.parse(output) as Record<string, unknown>;
}

async function leadHasCampaignThread(
  leadEmail: string,
  campaignIdValue: string,
): Promise<boolean> {
  const apiKey = getInstantlyApiKey();
  const sent = await listEmails(apiKey, {
    search: leadEmail,
    campaignId: campaignIdValue,
    emailType: "sent",
    limit: 5,
  });
  if (sent.length > 0) return true;

  const received = await listEmails(apiKey, {
    search: leadEmail,
    campaignId: campaignIdValue,
    emailType: "received",
    limit: 5,
  });
  return received.length > 0;
}

async function verifyEntrepriseRow(email: string): Promise<string | null> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("entreprise")
    .select("slug, reservation_entreprise_link, confirmation_agence_link")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read entreprise row: ${error.message}`);
  }
  if (!data?.slug || !data.reservation_entreprise_link || !data.confirmation_agence_link) {
    return null;
  }
  return data.reservation_entreprise_link;
}

async function verifyInstantlyVars(email: string, campaignIdValue: string): Promise<boolean> {
  const apiKey = getInstantlyApiKey();
  let lead = await findLeadByEmailInCampaign(apiKey, campaignIdValue, email);
  if (!lead?.id) return false;

  await new Promise((resolve) => setTimeout(resolve, 2000));

  lead = await instantlyFetch<typeof lead>(apiKey, `/leads/${lead.id}`, { method: "GET" });
  const vars = { ...(lead.payload ?? {}) };
  return Boolean(
    typeof vars.reservation_entreprise_link === "string" &&
      vars.reservation_entreprise_link.trim() &&
      typeof vars.confirmation_agence_link === "string" &&
      vars.confirmation_agence_link.trim(),
  );
}

function buildInterestedPayload(
  campaignIdValue: string,
  leadEmail: string,
): InstantlyWebhookPayload {
  return {
    timestamp: new Date().toISOString(),
    event_type: "lead_interested",
    workspace: "00000000-0000-0000-0000-000000000001",
    campaign_id: campaignIdValue,
    campaign_name: "Comptable flow E2E",
    lead_email: leadEmail,
    email_account: process.env.SMOKE_EACCOUNT?.trim() || "sender@hercule.dev",
    first_name: "Smoke",
  };
}

async function postInterestedWebhook(
  campaignIdValue: string,
  leadEmail: string,
): Promise<WebhookResponse> {
  const secret = cronSecret();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers.Authorization = `Bearer ${secret}`;

  const response = await fetch(`${baseUrl()}/api/webhooks/instantly`, {
    method: "POST",
    headers,
    body: JSON.stringify(buildInterestedPayload(campaignIdValue, leadEmail)),
  });

  const text = await response.text();
  let body: WebhookResponse = {};
  try {
    body = JSON.parse(text) as WebhookResponse;
  } catch {
    throw new Error(`Interested webhook non-JSON (${response.status}): ${text}`);
  }

  if (!response.ok) {
    throw new Error(`Interested webhook failed (${response.status}): ${text}`);
  }
  return body;
}

async function postReplyWebhook(
  campaignIdValue: string,
  leadEmail: string,
): Promise<WebhookResponse> {
  const secret = cronSecret();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers.Authorization = `Bearer ${secret}`;

  const payload = {
    timestamp: new Date().toISOString(),
    event_type: REPLY_WEBHOOK_EVENT,
    workspace: "00000000-0000-0000-0000-000000000001",
    campaign_id: campaignIdValue,
    campaign_name: "Comptable flow E2E",
    lead_email: leadEmail,
    email_account: process.env.SMOKE_EACCOUNT?.trim() || "sender@hercule.dev",
    reply_text: "Bonjour, oui je suis intéressé, pouvez-vous m'en dire plus ?",
    reply_subject: "Re: votre proposition",
  };

  const response = await fetch(`${baseUrl()}/api/webhooks/instantly/reply`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let body: WebhookResponse = {};
  try {
    body = JSON.parse(text) as WebhookResponse;
  } catch {
    throw new Error(`Reply webhook non-JSON (${response.status}): ${text}`);
  }

  if (!response.ok) {
    throw new Error(`Reply webhook failed (${response.status}): ${text}`);
  }
  return body;
}

async function markLeadInterested(campaignIdValue: string, leadEmail: string): Promise<void> {
  const apiKey = getInstantlyApiKey();
  await updateLeadInterestStatusBypass(apiKey, {
    campaign_id: campaignIdValue,
    lead_email: leadEmail,
    interest_value: INTERESTED_STATUS,
  });
}

async function backdateBypassJob(idempotencyKey: string): Promise<void> {
  const client = createBypassClient();
  const scheduledFor = new Date(Date.now() - 60_000).toISOString();
  const { error } = await client
    .from("instantly_bypass_jobs")
    .update({ scheduled_for: scheduledFor })
    .eq("idempotency_key", idempotencyKey)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Failed to backdate bypass job: ${error.message}`);
  }
}

async function backdateEventDispatchedAt(
  idempotencyKey: string,
  hoursAgo: number,
): Promise<void> {
  const client = createBypassClient();
  const dispatchedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
  const { error } = await client
    .from("instantly_bypass_events")
    .update({ dispatched_at: dispatchedAt })
    .eq("idempotency_key", idempotencyKey)
    .eq("status", "sent");

  if (error) {
    throw new Error(`Failed to backdate bypass event: ${error.message}`);
  }
}

async function runBypassJobsCron(): Promise<Record<string, unknown>> {
  const secret = requireEnv("CRON_SECRET");
  const response = await fetch(`${baseUrl()}/api/cron/instantly-bypass-jobs`, {
    method: "GET",
    headers: { Authorization: `Bearer ${secret}` },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Bypass jobs cron failed (${response.status}): ${text}`);
  }
  return JSON.parse(text) as Record<string, unknown>;
}

async function runPipelineCron(): Promise<Record<string, unknown>> {
  const secret = requireEnv("CRON_SECRET");
  const response = await fetch(`${baseUrl()}/api/cron/instantly-bypass-pipeline`, {
    method: "GET",
    headers: { Authorization: `Bearer ${secret}` },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Pipeline cron failed (${response.status}): ${text}`);
  }
  return JSON.parse(text) as Record<string, unknown>;
}

async function cleanupTestLead(
  email: string,
  campaignIdValue: string,
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const bypass = createBypassClient();
  const links = createLinkTrackingClient();

  const idemKeys = [
    interestedIdempotencyKey(campaignIdValue, normalized),
    flowIdempotencyKey("interested_email2", campaignIdValue, normalized),
    flowIdempotencyKey("interested_email3", campaignIdValue, normalized),
  ];

  await bypass
    .from("instantly_bypass_jobs")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("campaign_id", campaignIdValue)
    .eq("lead_email", normalized)
    .eq("status", "pending");

  for (const key of idemKeys) {
    await bypass.from("instantly_bypass_events").delete().eq("idempotency_key", key);
  }

  await bypass
    .from("instantly_bypass_pipeline")
    .delete()
    .eq("campaign_id", campaignIdValue)
    .eq("lead_email", normalized);

  await links.from("entreprise").delete().eq("email", normalized);

  await bypass
    .from("ai_reply_agent_messages")
    .delete()
    .eq("campaign_id", campaignIdValue)
    .eq("lead_email", normalized);

  await bypass
    .from("ai_reply_agent_leads")
    .delete()
    .eq("campaign_id", campaignIdValue)
    .eq("lead_email", normalized);

  console.log(`Cleaned Supabase state for ${normalized}`);
}

function recordStage(stages: StageResult[], stage: string, ok: boolean, detail: string): void {
  stages.push({ stage, ok, detail });
  console.log(`  [${ok ? "OK" : "FAIL"}] ${stage}: ${detail}`);
}

async function main(): Promise<void> {
  requireEnv("INSTANTLY_API_KEY");
  requireEnv("CRON_SECRET");
  requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  requireEnv("NEXT_PUBLIC_SUPABASE_URL");

  const email = buildLeadEmail();
  const campaign = campaignId();
  const list = listId();
  const mockLead = buildMockLead(email);
  const e1Key = interestedIdempotencyKey(campaign, email);
  const e2Key = flowIdempotencyKey("interested_email2", campaign, email);
  const stages: StageResult[] = [];

  console.log(`Mode: ${EXECUTE ? "execute" : "dry-run"}${PREPARE ? " + prepare" : ""}`);
  console.log(`Target: ${baseUrl()}`);
  console.log(`List: ${list}`);
  console.log(`Campaign: ${campaign}`);
  console.log(`Lead: ${email}`);

  if (PREPARE) {
    await cleanupTestLead(email, campaign);
  }

  const listPush = await pushLeadsToList(list, [mockLead]);
  recordStage(
    stages,
    "list_push",
    listPush.pushed + listPush.skipped >= 1,
    `pushed=${listPush.pushed} skipped=${listPush.skipped} failed=${listPush.failed}`,
  );

  const campaignPush = await pushLeadsToCampaign(campaign, [mockLead]);
  recordStage(
    stages,
    "campaign_push",
    campaignPush.pushed + campaignPush.skipped >= 1,
    `pushed=${campaignPush.pushed} skipped=${campaignPush.skipped} failed=${campaignPush.failed}`,
  );

  const provisionDry = runProvisionForEmail(email, true);
  recordStage(
    stages,
    "provision_dry_run",
    Number(provisionDry.selected ?? 0) >= 1,
    JSON.stringify(provisionDry),
  );

  if (!DRY_RUN) {
    const provision = runProvisionForEmail(email, false);
    recordStage(
      stages,
      "provision_execute",
      Number(provision.created ?? 0) + Number(provision.updated ?? 0) >= 1,
      JSON.stringify(provision),
    );

    const reservationLink = await verifyEntrepriseRow(email);
    recordStage(
      stages,
      "entreprise_row",
      Boolean(reservationLink),
      reservationLink ?? "missing entreprise row",
    );

    const varsOk =
      (await verifyInstantlyVars(email, campaign)) ||
      Number(provision.patched ?? 0) >= 1;
    recordStage(
      stages,
      "instantly_vars",
      varsOk,
      varsOk ? "canonical vars present" : "missing vars",
    );

    const interested = await postInterestedWebhook(campaign, email);
    const interestedOk =
      interested.ok === true &&
      interested.error !== "missing_reservation_link" &&
      (interested.skipped === "scheduled" ||
        interested.skipped === "already_scheduled" ||
        interested.skipped === "already_sent" ||
        interested.skipped === "e1_already_in_thread");
    recordStage(
      stages,
      "interested_webhook",
      interestedOk,
      JSON.stringify(interested),
    );

    assert.notEqual(
      interested.error,
      "missing_reservation_link",
      "entreprise reservation link must resolve for comptable bypass",
    );

    const hasThread = await leadHasCampaignThread(email, campaign);
    recordStage(
      stages,
      "unibox_thread",
      true,
      hasThread
        ? "campaign thread found (sends can run)"
        : "no thread — E1/E2/E3 crons skipped (set SMOKE_LEAD_EMAIL for full sends)",
    );

    if (EXECUTE && hasThread) {
      await backdateBypassJob(e1Key);
      const e1Cron = await runBypassJobsCron();
      recordStage(stages, "e1_cron", e1Cron.ok === true, JSON.stringify(e1Cron));

      await backdateEventDispatchedAt(e1Key, 25);
      const e2Cron = await runPipelineCron();
      recordStage(stages, "e2_cron", e2Cron.ok === true, JSON.stringify(e2Cron));

      await backdateEventDispatchedAt(e2Key, 49);
      const e3Cron = await runPipelineCron();
      recordStage(stages, "e3_cron", e3Cron.ok === true, JSON.stringify(e3Cron));
    } else if (EXECUTE) {
      console.log("SKIP E1/E2/E3 crons: no Unibox thread for test lead");
    }

    await markLeadInterested(campaign, email);
    const reply = await postReplyWebhook(campaign, email);
    const replyOk =
      reply.ok === true &&
      (reply.aiStatus === "auto_replied" ||
        reply.aiStatus === "pending" ||
        reply.skipped === "duplicate_event" ||
        reply.skipped === "groq_abstain" ||
        (!hasThread && reply.skipped === "thread_not_found"));
    recordStage(stages, "reply_webhook", replyOk, JSON.stringify(reply));
  } else {
    recordStage(
      stages,
      "entreprise_row",
      Number(provisionDry.selected ?? 0) >= 1,
      "dry-run only (row not created yet)",
    );
    recordStage(stages, "webhooks", true, "skipped in dry-run — run --execute");
  }

  const failed = stages.filter((stage) => !stage.ok);
  if (failed.length) {
    throw new Error(`Failed stages: ${failed.map((stage) => stage.stage).join(", ")}`);
  }

  if (!KEEP && PREPARE) {
    await cleanupTestLead(email, campaign);
  } else if (KEEP) {
    console.log(`KEEP test lead: ${email}`);
  }

  console.log(`All comptable flow E2E checks passed (${EXECUTE ? "execute" : "dry-run"}).`);
  if (DRY_RUN) {
    console.log("Run with --execute to provision links and exercise crons (needs Unibox thread).");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
