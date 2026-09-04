import {
  findLeadByEmailInCampaign,
  getInstantlyApiKey,
  replyToEmail,
  updateLeadInterestStatusBypass,
} from "./client";
import { hasBypassEvent, recordBypassEvent } from "./jobs";
import { upsertPipelineStep, type PipelineStep } from "./pipeline";
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
import { isWithinSendWindow, nextSendSlot } from "./send-window";
import { resolveThreadForReply } from "./thread-resolver";
import {
  buildTemplateVariables,
  isTemplateBodyEmpty,
  loadTemplate,
  renderTemplate,
  templateRequiresReservationLink,
} from "./templates";

import type { BypassFlow, InstantlyLeadRecord } from "./types";

const NOT_INTERESTED_STATUS = -1;

const STEP_AFTER_FLOW: Partial<Record<BypassFlow, PipelineStep>> = {
  interested_email1: "step_1",
  interested_email2: "step_2",
  interested_email3: "step_3",
};

const FINAL_FLOWS = new Set<BypassFlow>(["interested_email3"]);

const SENDABLE_FLOWS = new Set<BypassFlow>([
  "interested_email1",
  "interested_email2",
  "interested_email3",
]);

function readReservationLink(lead?: InstantlyLeadRecord | null): string | null {
  const payload = lead?.payload ?? {};
  const value = payload.reservation_agence_link;
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return null;
}

function readEmailAccount(lead?: Record<string, unknown> | null): string | undefined {
  if (!lead) return undefined;
  const payload =
    lead.payload && typeof lead.payload === "object"
      ? (lead.payload as Record<string, unknown>)
      : {};
  const value = payload.email_account ?? lead.email_account;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function executeBypassJob(job: BypassJob): Promise<void> {
  const flow = flowFromJob(job);
  if (!SENDABLE_FLOWS.has(flow)) {
    throw new Error(`Unsupported scheduled flow: ${flow}`);
  }

  if (await hasBypassEvent(job.idempotency_key)) {
    await markBypassJobSent(job.id);
    return;
  }

  if (!isWithinSendWindow()) {
    await rescheduleBypassJob(job.id, nextSendSlot());
    return;
  }

  const apiKey = getInstantlyApiKey();
  const leadEmail = job.lead_email.trim().toLowerCase();
  const snapshot = leadSnapshotFromJob(job);
  const lead =
    snapshot ??
    (await findLeadByEmailInCampaign(apiKey, job.campaign_id, leadEmail));

  const template = await loadTemplate(job.campaign_id, flow);
  if (isTemplateBodyEmpty(template.body_html)) {
    await recordBypassEvent({
      idempotencyKey: job.idempotency_key,
      flow,
      campaignId: job.campaign_id,
      leadEmail,
      leadId: leadIdFromJob(job),
      status: "failed",
      errorMessage: `Empty template ${flow}`,
    });
    await markBypassJobFailed(job.id, `Empty template ${flow}`);
    return;
  }

  if (
    templateRequiresReservationLink(template.body_html) &&
    !readReservationLink(lead ?? undefined)
  ) {
    await recordBypassEvent({
      idempotencyKey: job.idempotency_key,
      flow,
      campaignId: job.campaign_id,
      leadEmail,
      leadId: leadIdFromJob(job),
      status: "failed",
      errorMessage: "Missing reservation_agence_link on lead",
    });
    await markBypassJobFailed(job.id, "Missing reservation_agence_link on lead");
    return;
  }

  const thread = await resolveThreadForReply(apiKey, {
    leadEmail,
    campaignId: job.campaign_id,
    fallbackEaccount: readEmailAccount(snapshot),
  });

  if (!thread) {
    await recordBypassEvent({
      idempotencyKey: job.idempotency_key,
      flow,
      campaignId: job.campaign_id,
      leadEmail,
      leadId: leadIdFromJob(job),
      status: "failed",
      errorMessage: "Could not resolve Unibox thread",
    });
    await markBypassJobFailed(job.id, "Could not resolve Unibox thread");
    return;
  }
  const vars = buildTemplateVariables({}, lead ?? undefined);
  const rendered = renderTemplate(template, vars);
  const subject = thread.subject?.trim() || rendered.subject || "your message";
  const started = Date.now();

  await replyToEmail(apiKey, {
    eaccount: thread.eaccount,
    replyToUuid: thread.replyToUuid,
    subject,
    html: rendered.html,
  });

  const dispatchedAt = new Date();
  const latencyMs = dispatchedAt.getTime() - started;

  if (FINAL_FLOWS.has(flow)) {
    await updateLeadInterestStatusBypass(apiKey, {
      lead_email: leadEmail,
      interest_value: NOT_INTERESTED_STATUS,
      campaign_id: job.campaign_id,
    });
  }

  const nextStep = STEP_AFTER_FLOW[flow];
  if (nextStep) {
    await upsertPipelineStep(job.campaign_id, leadEmail, nextStep);
  }

  await recordBypassEvent({
    idempotencyKey: job.idempotency_key,
    flow,
    campaignId: job.campaign_id,
    leadEmail,
    leadId: leadIdFromJob(job),
    dispatchedAt,
    latencyMs,
    status: "sent",
    replyToUuid: thread.replyToUuid,
  });

  await markBypassJobSent(job.id);
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

      if (!isWithinSendWindow()) {
        await rescheduleBypassJob(job.id, nextSendSlot());
        rescheduled += 1;
        continue;
      }

      await executeBypassJob(job);
      sent += 1;
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
