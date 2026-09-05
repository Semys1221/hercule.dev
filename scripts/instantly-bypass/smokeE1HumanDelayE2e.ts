/**
 * E2E smoke: webhook E1 human delay (production).
 *
 * Usage:
 *   pnpm smoke-instantly-bypass-e1-human-delay-e2e --dry-run
 *   pnpm smoke-instantly-bypass-e1-human-delay-e2e --execute
 *
 * Requires in .env:
 *   NEXT_PUBLIC_APP_URL, CRON_SECRET, INSTANTLY_BYPASS_CAMPAIGN_ID,
 *   SMOKE_LEAD_EMAIL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL
 */

import assert from "node:assert/strict";

import { E1_WEBHOOK_HUMAN_DELAY_MS } from "@/lib/instantly-bypass/constants";
import { interestedIdempotencyKey } from "@/lib/instantly-bypass/jobs";
import { createBypassClient } from "@/lib/instantly-bypass/supabase";

import type { InstantlyWebhookPayload } from "@/lib/instantly-bypass/types";

const EXECUTE = process.argv.includes("--execute");
const DRY_RUN = process.argv.includes("--dry-run") || !EXECUTE;

const SCHEDULE_TOLERANCE_MS = 2 * 60 * 1000;

type BypassJobRow = {
  id: string;
  idempotency_key: string;
  campaign_id: string;
  lead_email: string;
  template_key: string;
  scheduled_for: string;
  status: string;
  payload: Record<string, unknown>;
  sent_at: string | null;
};

type WebhookResponse = {
  ok?: boolean;
  skipped?: string;
  error?: string;
  latencyMs?: number;
  replyToUuid?: string;
};

type CronResponse = {
  ok?: boolean;
  sent?: number;
  failed?: number;
  skipped?: number;
  rescheduled?: number;
  processed?: number;
  error?: string;
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

function cleanupSql(campaignId: string, leadEmail: string): string {
  const idem = interestedIdempotencyKey(campaignId, leadEmail);
  return [
    `-- Cancel pending job`,
    `UPDATE instantly_bypass_jobs SET status = 'cancelled', cancelled_at = now()`,
    `WHERE idempotency_key = '${idem}' AND status = 'pending';`,
    ``,
    `-- Reset E1 for re-test`,
    `DELETE FROM instantly_bypass_events WHERE idempotency_key = '${idem}';`,
    `UPDATE instantly_bypass_pipeline SET step = 'step_0'`,
    `WHERE campaign_id = '${campaignId}' AND lead_email = '${leadEmail}';`,
  ].join("\n");
}

function buildWebhookPayload(
  campaignId: string,
  leadEmail: string,
): InstantlyWebhookPayload {
  return {
    timestamp: new Date().toISOString(),
    event_type: "lead_interested",
    workspace: "00000000-0000-0000-0000-000000000001",
    campaign_id: campaignId,
    campaign_name: "E1 Human Delay E2E",
    lead_email: leadEmail,
    email_account: process.env.SMOKE_EACCOUNT?.trim() || "sender@example.com",
    first_name: "Smoke",
  };
}

async function postWebhook(
  campaignId: string,
  leadEmail: string,
): Promise<WebhookResponse> {
  const secret = cronSecret();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  const url = `${baseUrl()}/api/webhooks/instantly`;
  console.log(`POST ${url} (${leadEmail})`);

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(buildWebhookPayload(campaignId, leadEmail)),
  });

  const text = await response.text();
  let body: WebhookResponse = {};
  try {
    body = JSON.parse(text) as WebhookResponse;
  } catch {
    throw new Error(`Webhook returned non-JSON (${response.status}): ${text}`);
  }

  console.log(`Webhook status: ${response.status}`, JSON.stringify(body));

  if (!response.ok) {
    throw new Error(`Webhook failed (${response.status}): ${text}`);
  }

  return body;
}

async function fetchJob(idempotencyKey: string): Promise<BypassJobRow | null> {
  const client = createBypassClient();
  const { data, error } = await client
    .from("instantly_bypass_jobs")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch bypass job: ${error.message}`);
  }

  return (data as BypassJobRow | null) ?? null;
}

function assertJobScheduled(
  job: BypassJobRow,
  receivedAt: Date,
  campaignId: string,
  leadEmail: string,
): void {
  assert.equal(job.status, "pending", "job should be pending");
  assert.equal(job.template_key, "interested_email1");
  assert.equal(job.campaign_id, campaignId);
  assert.equal(job.lead_email, leadEmail.trim().toLowerCase());
  assert.equal(job.payload?.bypass_send_window, true);

  const scheduledAt = new Date(job.scheduled_for).getTime();
  const expectedAt = receivedAt.getTime() + E1_WEBHOOK_HUMAN_DELAY_MS;
  const delta = Math.abs(scheduledAt - expectedAt);
  assert.ok(
    delta <= SCHEDULE_TOLERANCE_MS,
    `scheduled_for off by ${delta}ms (expected ~${E1_WEBHOOK_HUMAN_DELAY_MS}ms after webhook)`,
  );
}

async function backdateJob(idempotencyKey: string): Promise<void> {
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
  console.log(`Backdated job ${idempotencyKey} to ${scheduledFor}`);
}

async function runCron(): Promise<CronResponse> {
  const secret = requireEnv("CRON_SECRET");
  const url = `${baseUrl()}/api/cron/instantly-bypass-jobs`;
  console.log(`GET ${url}`);

  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${secret}` },
  });

  const text = await response.text();
  let body: CronResponse = {};
  try {
    body = JSON.parse(text) as CronResponse;
  } catch {
    throw new Error(`Cron returned non-JSON (${response.status}): ${text}`);
  }

  console.log(`Cron status: ${response.status}`, JSON.stringify(body));

  if (!response.ok) {
    throw new Error(`Cron failed (${response.status}): ${text}`);
  }

  return body;
}

async function verifySentState(
  idempotencyKey: string,
  campaignId: string,
  leadEmail: string,
): Promise<void> {
  const client = createBypassClient();
  const normalizedEmail = leadEmail.trim().toLowerCase();

  const { data: job, error: jobError } = await client
    .from("instantly_bypass_jobs")
    .select("status, sent_at")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (jobError) {
    throw new Error(`Failed to read job after cron: ${jobError.message}`);
  }
  assert.equal(job?.status, "sent", "job should be marked sent");
  assert.ok(job?.sent_at, "job.sent_at should be set");

  const { data: event, error: eventError } = await client
    .from("instantly_bypass_events")
    .select("status, flow, reply_to_uuid, latency_ms")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (eventError) {
    throw new Error(`Failed to read event after cron: ${eventError.message}`);
  }
  assert.equal(event?.status, "sent", "event should be sent");
  assert.equal(event?.flow, "interested_email1");
  if (event?.reply_to_uuid) {
    console.log(`reply_to_uuid: ${event.reply_to_uuid}`);
  }
  if (event?.latency_ms != null) {
    console.log(`latency_ms: ${event.latency_ms}`);
  }

  const { data: pipeline, error: pipelineError } = await client
    .from("instantly_bypass_pipeline")
    .select("step")
    .eq("campaign_id", campaignId)
    .eq("lead_email", normalizedEmail)
    .maybeSingle();

  if (pipelineError) {
    throw new Error(`Failed to read pipeline after cron: ${pipelineError.message}`);
  }
  assert.equal(pipeline?.step, "step_1", "pipeline should advance to step_1");
}

async function runDryRunPhase(
  campaignId: string,
  leadEmail: string,
  idempotencyKey: string,
): Promise<BypassJobRow> {
  const receivedAt = new Date();
  const first = await postWebhook(campaignId, leadEmail);

  if (first.skipped === "already_sent") {
    console.error("Lead already has E1 sent. Run cleanup SQL:\n");
    console.error(cleanupSql(campaignId, leadEmail));
    throw new Error("already_sent — cleanup required before E2E test");
  }

  if (first.skipped === "scheduled" || first.skipped === "already_scheduled") {
    const job = await fetchJob(idempotencyKey);
    if (!job) {
      throw new Error(`Expected bypass job for ${idempotencyKey}`);
    }
    if (first.skipped === "scheduled") {
      assertJobScheduled(job, receivedAt, campaignId, leadEmail);
      console.log("OK webhook scheduled E1 (+15 min)");
    } else {
      console.log("OK webhook already_scheduled (reusing pending job)");
    }
  } else {
    throw new Error(
      `Unexpected webhook response: ${JSON.stringify(first)} (is prod deployed with E1 delay?)`,
    );
  }

  const second = await postWebhook(campaignId, leadEmail);
  assert.equal(second.skipped, "already_scheduled", "retry should be already_scheduled");
  console.log("OK webhook retry → already_scheduled");

  const job = await fetchJob(idempotencyKey);
  if (!job) {
    throw new Error(`Missing job after dry-run for ${idempotencyKey}`);
  }
  return job;
}

async function runExecutePhase(
  campaignId: string,
  leadEmail: string,
  idempotencyKey: string,
): Promise<void> {
  const job = await fetchJob(idempotencyKey);
  if (!job || job.status !== "pending") {
    throw new Error(
      `No pending job for execute phase (${idempotencyKey}). Run --dry-run first.`,
    );
  }

  await backdateJob(idempotencyKey);
  const cron = await runCron();

  assert.equal(cron.ok, true);
  assert.ok(
    (cron.sent ?? 0) >= 1 || (cron.skipped ?? 0) >= 1,
    `cron should send or skip: ${JSON.stringify(cron)}`,
  );

  if ((cron.sent ?? 0) >= 1) {
    console.log("OK cron dispatched E1");
  } else {
    console.log("OK cron skipped (already sent via another path)");
  }

  await verifySentState(idempotencyKey, campaignId, leadEmail);
  console.log("OK event sent + pipeline step_1");
}

async function main(): Promise<void> {
  const campaignId = requireEnv("INSTANTLY_BYPASS_CAMPAIGN_ID");
  const leadEmail = requireEnv("SMOKE_LEAD_EMAIL");
  const idempotencyKey = interestedIdempotencyKey(campaignId, leadEmail);

  console.log(`Mode: ${EXECUTE ? "execute" : "dry-run"}`);
  console.log(`Campaign: ${campaignId}`);
  console.log(`Lead: ${leadEmail}`);
  console.log(`Idempotency: ${idempotencyKey}`);

  await runDryRunPhase(campaignId, leadEmail, idempotencyKey);

  if (EXECUTE) {
    await runExecutePhase(campaignId, leadEmail, idempotencyKey);
    console.log("All E1 human delay E2E tests passed (execute).");
  } else {
    console.log("All E1 human delay E2E tests passed (dry-run).");
    console.log("Run with --execute to force dispatch and send E1.");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
