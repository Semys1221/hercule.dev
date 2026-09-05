import { replyToEmail, getInstantlyApiKey } from "@/lib/instantly-bypass/client";
import {
  isWithinSendWindow,
  nextSendSlot,
} from "@/lib/instantly-bypass/send-window";

import {
  listDueAiReplyJobs,
  markAiReplyJobFailed,
  markAiReplyJobSent,
  rescheduleAiReplyJob,
  updateInboundStatus,
  insertOutboundMessage,
  type AiReplyAgentJob,
} from "./messages";

async function executeManualJob(job: AiReplyAgentJob): Promise<
  "sent" | "failed" | "rescheduled"
> {
  if (!isWithinSendWindow()) {
    await rescheduleAiReplyJob(job.id, nextSendSlot());
    return "rescheduled";
  }

  const eaccount = String(job.payload.eaccount ?? "").trim();
  const replyToUuid = String(job.payload.reply_to_uuid ?? "").trim();
  const subject = String(job.payload.subject ?? "Re: votre message").trim();
  const html = String(job.payload.html ?? "").trim();
  const bodyText = String(job.payload.body_text ?? "").trim();

  if (!eaccount || !replyToUuid || !html) {
    await markAiReplyJobFailed(job.id, "invalid_job_payload");
    return "failed";
  }

  try {
    const apiKey = getInstantlyApiKey();
    await replyToEmail(apiKey, {
      eaccount,
      replyToUuid,
      subject,
      html,
    });

    if (job.message_id) {
      await updateInboundStatus(job.message_id, "manual_replied");
    }
    await insertOutboundMessage({
      campaignId: job.campaign_id,
      leadEmail: job.lead_email,
      bodyText,
      subject,
      emailAccount: eaccount,
      aiStatus: "manual_replied",
      replyToUuid,
    });
    await markAiReplyJobSent(job.id);
    return "sent";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markAiReplyJobFailed(job.id, message);
    return "failed";
  }
}

export async function dispatchDueAiReplyJobs(limit = 50): Promise<{
  processed: number;
  sent: number;
  failed: number;
  rescheduled: number;
}> {
  const jobs = await listDueAiReplyJobs(limit);
  let sent = 0;
  let failed = 0;
  let rescheduled = 0;

  for (const job of jobs) {
    const result = await executeManualJob(job);
    if (result === "sent") sent += 1;
    if (result === "failed") failed += 1;
    if (result === "rescheduled") rescheduled += 1;
  }

  return {
    processed: jobs.length,
    sent,
    failed,
    rescheduled,
  };
}
