import { shouldBypassSendWindow } from "./constants";
import { hasBypassEvent, recordBypassEvent } from "./jobs";
import { executeBypassFlow } from "./send-flow";
import { isWithinSendWindow, nextSendSlot } from "./send-window";
import {
  flowFromJob,
  leadIdFromJob,
  leadSnapshotFromJob,
  listDueBypassJobs,
  markBypassJobFailed,
  markBypassJobSent,
  rescheduleBypassJob,
  type BypassJob,
} from "./scheduled-jobs";

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

async function executeBypassJob(
  job: BypassJob,
): Promise<"sent" | "failed" | "skipped" | "rescheduled"> {
  const flow = flowFromJob(job);
  if (!SENDABLE_FLOWS.has(flow)) {
    throw new Error(`Unsupported scheduled flow: ${flow}`);
  }

  if (await hasBypassEvent(job.idempotency_key)) {
    await markBypassJobSent(job.id);
    return "skipped";
  }

  if (!shouldBypassSendWindow(job.payload) && !isWithinSendWindow()) {
    await rescheduleBypassJob(job.id, nextSendSlot());
    return "rescheduled";
  }

  const leadEmail = job.lead_email.trim().toLowerCase();
  const snapshot = leadSnapshotFromJob(job) as InstantlyLeadRecord | null;
  const customBodyHtml =
    typeof job.payload?.body_html === "string" && job.payload.body_html.trim()
      ? job.payload.body_html
      : null;
  const webhookContext = webhookContextFromJob(job);

  const result = await executeBypassFlow({
    flow,
    campaignId: job.campaign_id,
    leadEmail,
    lead: snapshot,
    leadId: leadIdFromJob(job),
    idempotencyKey: job.idempotency_key,
    customBodyHtml,
    webhookPayload: webhookContext.webhookPayload,
    webhookReceivedAt: webhookContext.webhookReceivedAt,
    preferredEmailId: webhookContext.preferredEmailId,
    fallbackEaccount: webhookContext.fallbackEaccount,
  });

  if (!result.ok) {
    await markBypassJobFailed(job.id, result.error);
    return "failed";
  }

  if (result.skipped) {
    await markBypassJobSent(job.id);
    return "skipped";
  }

  await markBypassJobSent(job.id);
  return "sent";
}

export async function dispatchDueBypassJobs(limit = 50): Promise<{
  processed: number;
  sent: number;
  failed: number;
  rescheduled: number;
  skipped: number;
}> {
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
      if (outcome === "sent") sent += 1;
      else if (outcome === "failed") failed += 1;
      else if (outcome === "rescheduled") rescheduled += 1;
      else skipped += 1;
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : String(err);
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
    }
  }

  return {
    processed: jobs.length,
    sent,
    failed,
    rescheduled,
    skipped,
  };
}
