import { shouldBypassSendWindow } from "./constants";
import { hasBypassEvent, recordBypassEvent } from "./jobs";
import { executeBypassFlow } from "./send-flow";
import { isWithinSendWindow, nextSendSlot } from "./send-window";
import {
  flowFromJob,
  leadIdFromJob,
  leadSnapshotFromJob,
  getBypassJobByIdempotencyKey,
  listDueBypassJobs,
  listFailedBypassJobs,
  markBypassJobFailed,
  markBypassJobSent,
  rescheduleBypassJob,
  retryBypassJob,
  type BypassJob,
} from "./scheduled-jobs";
import {
  isTransientBypassError,
  MAX_BYPASS_JOB_RETRIES,
  retryBackoffMs,
  retryCountFromPayload,
} from "./transient-errors";

import type {
  BypassFlow,
  InstantlyLeadRecord,
  InstantlyWebhookPayload,
} from "./types";

function webhookContextFromJob(job: BypassJob) {
  const payload = job.payload ?? {};
  const webhookPayload = payload.webhook_payload as
    | InstantlyWebhookPayload
    | undefined;
  const webhookReceivedAt =
    typeof payload.webhook_received_at === "string" &&
    payload.webhook_received_at.trim()
      ? new Date(payload.webhook_received_at)
      : undefined;
  const preferredEmailId =
    typeof payload.preferred_email_id === "string" &&
    payload.preferred_email_id.trim()
      ? payload.preferred_email_id.trim()
      : undefined;
  const fallbackEaccount =
    typeof payload.fallback_eaccount === "string" &&
    payload.fallback_eaccount.trim()
      ? payload.fallback_eaccount.trim()
      : undefined;

  return {
    webhookPayload,
    webhookReceivedAt,
    preferredEmailId,
    fallbackEaccount,
  };
}

const SENDABLE_FLOWS = new Set<BypassFlow>([
  "interested_email1",
  "interested_email2",
  "interested_email3",
]);

function templateSnapshotFromJob(job: BypassJob) {
  const payload = job.payload ?? {};
  const subject =
    typeof payload.template_subject === "string" ? payload.template_subject : "";
  const bodyHtml =
    typeof payload.template_body_html === "string"
      ? payload.template_body_html
      : typeof payload.body_html === "string"
        ? payload.body_html
        : "";
  if (!bodyHtml.trim()) {
    return null;
  }
  return { subject, body_html: bodyHtml };
}

async function handleBypassJobFailure(
  job: BypassJob,
  message: string,
): Promise<"failed" | "rescheduled"> {
  const retryCount = retryCountFromPayload(job.payload);
  if (isTransientBypassError(message) && retryCount < MAX_BYPASS_JOB_RETRIES) {
    const nextRetry = retryCount + 1;
    const scheduledFor = new Date(Date.now() + retryBackoffMs(nextRetry));
    await retryBypassJob(job, scheduledFor, nextRetry);
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "3be66b",
      },
      body: JSON.stringify({
        sessionId: "3be66b",
        location: "lib/instantly-bypass/dispatch-scheduled.ts:retry",
        message: "Transient bypass job failure — rescheduled",
        data: {
          jobId: job.id,
          campaignId: job.campaign_id,
          leadEmail: job.lead_email,
          error: message,
          retryCount: nextRetry,
          scheduledFor: scheduledFor.toISOString(),
          hypothesisId: "A",
        },
        timestamp: Date.now(),
        runId: "pre-fix",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion
    return "rescheduled";
  }

  await markBypassJobFailed(job.id, message);
  await recordBypassEvent({
    idempotencyKey: job.idempotency_key,
    flow: flowFromJob(job),
    campaignId: job.campaign_id,
    leadEmail: job.lead_email,
    leadId: leadIdFromJob(job),
    status: "failed",
    errorMessage: message,
  }).catch(() => undefined);
  return "failed";
}

export type BypassJobDispatchResult = {
  outcome: "sent" | "failed" | "skipped" | "rescheduled" | "not_found";
  latencyMs?: number;
  replyToUuid?: string;
  skipped?: string;
  error?: string;
};

async function executeBypassJob(job: BypassJob): Promise<BypassJobDispatchResult> {
  const flow = flowFromJob(job);
  if (!SENDABLE_FLOWS.has(flow)) {
    throw new Error(`Unsupported scheduled flow: ${flow}`);
  }

  if (await hasBypassEvent(job.idempotency_key)) {
    await markBypassJobSent(job.id);
    return { outcome: "skipped", skipped: "already_sent" };
  }

  if (!shouldBypassSendWindow(job.payload) && !isWithinSendWindow()) {
    await rescheduleBypassJob(job.id, nextSendSlot());
    return { outcome: "rescheduled" };
  }

  const leadEmail = job.lead_email.trim().toLowerCase();
  const snapshot = leadSnapshotFromJob(job) as InstantlyLeadRecord | null;
  const templateSnapshot = templateSnapshotFromJob(job);
  const customBodyHtml = templateSnapshot?.body_html?.trim() || null;
  const webhookContext = webhookContextFromJob(job);

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "3be66b",
      },
      body: JSON.stringify({
        sessionId: "3be66b",
      location: "lib/instantly-bypass/dispatch-scheduled.ts:dispatch",
      message: "Dispatching bypass job",
      data: {
        jobId: job.id,
        campaignId: job.campaign_id,
        leadEmail,
        flow,
        hasTemplateSnapshot: Boolean(templateSnapshot),
        retryCount: retryCountFromPayload(job.payload),
        hypothesisId: "A,B",
      },
      timestamp: Date.now(),
      runId: "pre-fix",
      hypothesisId: "A,B",
    }),
  }).catch(() => {});
  // #endregion

  const result = await executeBypassFlow({
    flow,
    campaignId: job.campaign_id,
    leadEmail,
    lead: snapshot,
    leadId: leadIdFromJob(job),
    idempotencyKey: job.idempotency_key,
    customBodyHtml,
    templateSnapshot,
    webhookPayload: webhookContext.webhookPayload,
    webhookReceivedAt: webhookContext.webhookReceivedAt,
    preferredEmailId: webhookContext.preferredEmailId,
    fallbackEaccount: webhookContext.fallbackEaccount,
  });

  if (!result.ok) {
    const failureOutcome = await handleBypassJobFailure(job, result.error);
    if (failureOutcome === "rescheduled") {
      return { outcome: "rescheduled" };
    }
    return { outcome: "failed", error: result.error };
  }

  if (result.skipped) {
    await markBypassJobSent(job.id);
    return { outcome: "skipped", skipped: result.skipped };
  }

  await markBypassJobSent(job.id);
  return {
    outcome: "sent",
    latencyMs: result.latencyMs,
    replyToUuid: result.replyToUuid,
  };
}

export async function dispatchBypassJobByIdempotencyKey(
  idempotencyKey: string,
): Promise<BypassJobDispatchResult> {
  const job = await getBypassJobByIdempotencyKey(idempotencyKey);
  if (!job || job.status !== "pending") {
    return { outcome: "not_found" };
  }

  const result = await executeBypassJob(job);

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "b88b1a",
    },
    body: JSON.stringify({
      sessionId: "b88b1a",
      location: "lib/instantly-bypass/dispatch-scheduled.ts:immediate",
      message: "E1 immediate dispatch completed",
      data: {
        idempotencyKey,
        outcome: result.outcome,
        latencyMs: result.latencyMs ?? null,
        skipped: result.skipped ?? null,
        error: result.error ?? null,
      },
      timestamp: Date.now(),
      runId: "post-fix",
      hypothesisId: "E1-instant",
    }),
  }).catch(() => {});
  // #endregion

  return result;
}

async function recoverTransientFailedBypassJobs(limit = 20): Promise<number> {
  const failedJobs = await listFailedBypassJobs(limit);
  let recovered = 0;

  for (const job of failedJobs) {
    const message = job.error_message ?? "";
    const retryCount = retryCountFromPayload(job.payload);
    if (!isTransientBypassError(message) || retryCount >= MAX_BYPASS_JOB_RETRIES) {
      continue;
    }
    await retryBypassJob(job, new Date(), retryCount + 1);
    recovered += 1;
  }

  return recovered;
}

export async function dispatchDueBypassJobs(limit = 50): Promise<{
  processed: number;
  sent: number;
  failed: number;
  rescheduled: number;
  skipped: number;
  recovered: number;
}> {
  const recovered = await recoverTransientFailedBypassJobs();
  const jobs = await listDueBypassJobs(limit);
  let sent = 0;
  let failed = 0;
  let rescheduled = 0;
  let skipped = 0;

  for (const job of jobs) {
    try {
      if (await hasBypassEvent(job.idempotency_key)) {
        await markBypassJobSent(job.id);
        skipped += 1;
        continue;
      }

      if (!shouldBypassSendWindow(job.payload) && !isWithinSendWindow()) {
        await rescheduleBypassJob(job.id, nextSendSlot());
        rescheduled += 1;
        continue;
      }

      const outcome = await executeBypassJob(job);
      if (outcome.outcome === "sent") sent += 1;
      else if (outcome.outcome === "failed") failed += 1;
      else if (outcome.outcome === "rescheduled") rescheduled += 1;
      else skipped += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const outcome = await handleBypassJobFailure(job, message);
      if (outcome === "rescheduled") rescheduled += 1;
      else failed += 1;
    }
  }

  return {
    processed: jobs.length,
    sent,
    failed,
    rescheduled,
    skipped,
    recovered,
  };
}
