import {
  createLinkTrackingClient,
  markLeadCancelled,
} from "@/lib/link-tracking/supabase";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";
import {
  cancelScheduledEvent,
  extractEventUuidFromPayload,
} from "@/lib/calendly";
import { syncLeadStatutToInstantly } from "@/lib/link-tracking/instantly";

import {
  cancelFollowUpJobs,
  cancelJob,
  hasSequenceStarted,
  insertJob,
  listDueJobs,
  markJobFailed,
  markJobSent,
} from "./jobs";
import { sendBookingPlainText } from "./send";
import { h20SendAt, h24SendAt, h48SendAt } from "./schedule";
import { renderEmailFromStore } from "./template-store";
import { buildConfirmUrl } from "./templates";
import type { BookingEmailJob, BookingEmailType, StartSequenceParams } from "./types";

const FOLLOW_UP_TYPES: BookingEmailType[] = [
  "h48_confirm",
  "h24_relance",
  "h20_cancel",
];

function jobKey(
  leadId: string,
  emailType: string,
  inviteeUri: string | null,
): string {
  const suffix = inviteeUri?.trim() || "manual";
  return `${leadId}:${emailType}:${suffix}`;
}

export async function startBookingSequence(
  params: StartSequenceParams,
): Promise<{ started: boolean; reason?: string }> {
  const { lead, category, triggeredBy } = params;

  if (await hasSequenceStarted(lead.id)) {
    return { started: false, reason: "already_started" };
  }

  const inviteeUri = lead.calendly_invitee_uri;
  const immediateAt = params.sequenceStartsAt ?? new Date();

  await insertJob({
    category,
    leadId: lead.id,
    emailType: "immediate",
    scheduledFor: immediateAt,
    triggeredBy,
    idempotencyKey: jobKey(lead.id, "immediate", inviteeUri),
  });

  if (category === "agence" && lead.scheduled_at) {
    await insertJob({
      category,
      leadId: lead.id,
      emailType: "h48_confirm",
      scheduledFor: h48SendAt(lead.scheduled_at),
      triggeredBy,
      idempotencyKey: jobKey(lead.id, "h48_confirm", inviteeUri),
    });
    await insertJob({
      category,
      leadId: lead.id,
      emailType: "h24_relance",
      scheduledFor: h24SendAt(lead.scheduled_at),
      triggeredBy,
      idempotencyKey: jobKey(lead.id, "h24_relance", inviteeUri),
    });
    await insertJob({
      category,
      leadId: lead.id,
      emailType: "h20_cancel",
      scheduledFor: h20SendAt(lead.scheduled_at),
      triggeredBy,
      idempotencyKey: jobKey(lead.id, "h20_cancel", inviteeUri),
    });
  }

  if (!params.sequenceStartsAt || params.sequenceStartsAt.getTime() <= Date.now()) {
    await dispatchDueJobsForLead(lead.id);
  }

  return { started: true };
}

export async function dispatchDueBookingEmails(limit = 50): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const jobs = await listDueJobs(limit);
  let sent = 0;
  let failed = 0;

  for (const job of jobs) {
    const ok = await processJob(job);
    if (ok) sent += 1;
    else failed += 1;
  }

  return { processed: jobs.length, sent, failed };
}

async function dispatchDueJobsForLead(leadId: string): Promise<void> {
  const jobs = (await listDueJobs(100)).filter((job) => job.lead_id === leadId);
  for (const job of jobs) {
    await processJob(job);
  }
}

async function processJob(job: BookingEmailJob): Promise<boolean> {
  const lead = await loadLead(job.lead_category, job.lead_id);
  if (!lead) {
    await markJobFailed(job.id, "lead_not_found");
    return false;
  }

  if (lead.statut === "CANCELLED") {
    await cancelJob(job.id);
    return true;
  }

  if (
    lead.statut === "CONFIRMED" &&
    FOLLOW_UP_TYPES.includes(job.email_type)
  ) {
    await cancelJob(job.id);
    return true;
  }

  if (job.email_type === "h20_cancel") {
    return processH20CancelJob(job, lead);
  }

  const rendered = await renderJobEmail(job, lead);
  const result = await sendBookingPlainText({
    to: lead.email,
    subject: rendered.subject,
    text: rendered.text,
    idempotencyKey: job.idempotency_key,
  });

  if (!result.ok) {
    await markJobFailed(job.id, result.error);
    return false;
  }

  await markJobSent(job.id, result.id);
  return true;
}

async function processH20CancelJob(
  job: BookingEmailJob,
  lead: LinkTrackingLead,
): Promise<boolean> {
  if (lead.statut === "CONFIRMED" || lead.statut === "CANCELLED") {
    await cancelJob(job.id);
    return true;
  }

  const rendered = await renderJobEmail(job, lead);
  const result = await sendBookingPlainText({
    to: lead.email,
    subject: rendered.subject,
    text: rendered.text,
    idempotencyKey: job.idempotency_key,
  });

  if (!result.ok) {
    await markJobFailed(job.id, result.error);
    return false;
  }

  await markJobSent(job.id, result.id);

  const eventUuid = extractEventUuidFromPayload(lead.calendly_payload);
  if (eventUuid) {
    try {
      await cancelScheduledEvent(
        eventUuid,
        "Annulation automatique — absence de confirmation de présence.",
      );
    } catch (err) {
      console.error("[booking-communication] Calendly cancel failed:", err);
    }
  } else {
    console.warn(
      `[booking-communication] No Calendly event UUID for lead ${lead.id}`,
    );
  }

  const client = createLinkTrackingClient();
  const lookup = { category: job.lead_category, lead };
  const cancelled = await markLeadCancelled(client, lookup);
  await cancelFollowUpJobs(cancelled.lead.id);

  try {
    await syncLeadStatutToInstantly(
      cancelled.lead,
      cancelled.category,
      "CANCELLED",
    );
  } catch (err) {
    console.error("[booking-communication] Instantly cancel sync failed:", err);
  }

  return true;
}

async function renderJobEmail(job: BookingEmailJob, lead: LinkTrackingLead) {
  const confirmUrl = buildConfirmUrl(lead.link, lead.email);
  return renderEmailFromStore({
    category: job.lead_category,
    emailType: job.email_type,
    firstName: lead.first_name,
    scheduledAt: lead.scheduled_at,
    confirmUrl,
  });
}

async function loadLead(
  category: BookingEmailJob["lead_category"],
  leadId: string,
): Promise<LinkTrackingLead | null> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from(category)
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as LinkTrackingLead | null) ?? null;
}
