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
  getThreadContext,
  hasRoleRecoverySequenceStarted,
  hasSequenceStarted,
  insertJob,
  listDueJobs,
  markJobFailed,
  markJobSent,
} from "./jobs";
import { sendBookingEmail } from "./send";
import { h20SendAt, h24SendAt, h48SendAt, planRoleRecoverySchedule } from "./schedule";
import { renderEmailFromStore } from "./template-store";
import { buildTemporaryConfirmUrl } from "./templates";
import { defaultUseHtml } from "./signatures";
import { confirmationAgenceLinkFor } from "@/lib/link-tracking/urls";
import { buildReplySubject, buildThreadHeaders, isThreadFollowUp, threadTypesForJob } from "./threading";
import type { BookingEmailJob, BookingEmailType, StartSequenceParams } from "./types";
import type { RenderedBookingEmail } from "./types";

const FOLLOW_UP_TYPES: BookingEmailType[] = [
  "h48_confirm",
  "h24_relance",
  "h20_cancel",
  "role_seq_24",
];

const MAIN_AGENCE_TYPES: BookingEmailType[] = [
  "immediate",
  "h48_confirm",
  "h24_relance",
  "h20_cancel",
];

const ENTREPRISE_TYPES: BookingEmailType[] = ["immediate"];

const ROLE_RECOVERY_TYPES: BookingEmailType[] = ["role_seq_48", "role_seq_24"];

function allowedMainTypes(category: StartSequenceParams["category"]): BookingEmailType[] {
  return category === "entreprise" ? ENTREPRISE_TYPES : MAIN_AGENCE_TYPES;
}

function resolveMainEmailTypes(
  category: StartSequenceParams["category"],
  emailTypes?: BookingEmailType[],
): BookingEmailType[] | { error: string } {
  const allowed = allowedMainTypes(category);
  if (!emailTypes?.length) {
    return allowed;
  }
  const invalid = emailTypes.filter((type) => !allowed.includes(type));
  if (invalid.length > 0) {
    return { error: `invalid_email_types:${invalid.join(",")}` };
  }
  return emailTypes;
}

function resolveRoleRecoveryEmailTypes(
  emailTypes?: BookingEmailType[],
): BookingEmailType[] | { error: string } {
  if (!emailTypes?.length) {
    return ROLE_RECOVERY_TYPES;
  }
  const invalid = emailTypes.filter((type) => !ROLE_RECOVERY_TYPES.includes(type));
  if (invalid.length > 0) {
    return { error: `invalid_email_types:${invalid.join(",")}` };
  }
  return emailTypes;
}

function scheduledForMainType(
  emailType: BookingEmailType,
  params: StartSequenceParams,
): Date | null {
  const { lead, sequenceStartsAt } = params;
  if (emailType === "immediate") {
    return sequenceStartsAt ?? new Date();
  }
  if (!lead.scheduled_at) {
    return null;
  }
  if (emailType === "h48_confirm") {
    return h48SendAt(lead.scheduled_at);
  }
  if (emailType === "h24_relance") {
    return h24SendAt(lead.scheduled_at);
  }
  if (emailType === "h20_cancel") {
    return h20SendAt(lead.scheduled_at);
  }
  return null;
}

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

  if (!params.partial && (await hasSequenceStarted(lead.id))) {
    return { started: false, reason: "already_started" };
  }

  const resolved = resolveMainEmailTypes(category, params.emailTypes);
  if ("error" in resolved) {
    return { started: false, reason: resolved.error };
  }

  const inviteeUri = lead.calendly_invitee_uri;
  let inserted = 0;

  for (const emailType of resolved) {
    const scheduledFor = scheduledForMainType(emailType, params);
    if (!scheduledFor) {
      continue;
    }
    const job = await insertJob({
      category,
      leadId: lead.id,
      emailType,
      scheduledFor,
      triggeredBy,
      idempotencyKey: jobKey(lead.id, emailType, inviteeUri),
      useHtml: params.htmlByType?.[emailType] ?? null,
    });
    if (job) {
      inserted += 1;
    }
  }

  if (inserted === 0) {
    return { started: false, reason: "no_jobs_inserted" };
  }

  await dispatchDueJobsForLead(lead.id);

  return { started: true };
}

export async function startRoleRecoverySequence(
  params: StartSequenceParams,
): Promise<{ started: boolean; reason?: string }> {
  const { lead, category, triggeredBy } = params;

  if (category !== "agence") {
    return { started: false, reason: "agence_only" };
  }

  if (!lead.scheduled_at) {
    return { started: false, reason: "missing_scheduled_at" };
  }

  if (!params.partial && (await hasRoleRecoverySequenceStarted(lead.id))) {
    return { started: false, reason: "already_started" };
  }

  const resolved = resolveRoleRecoveryEmailTypes(params.emailTypes);
  if ("error" in resolved) {
    return { started: false, reason: resolved.error };
  }

  const inviteeUri = lead.calendly_invitee_uri;
  const schedule = planRoleRecoverySchedule(lead.scheduled_at);
  const scheduleByType: Record<"role_seq_48" | "role_seq_24", Date> = {
    role_seq_48: schedule.roleSeq48,
    role_seq_24: schedule.roleSeq24,
  };

  let inserted = 0;
  for (const emailType of resolved) {
    if (emailType !== "role_seq_48" && emailType !== "role_seq_24") {
      continue;
    }
    const job = await insertJob({
      category,
      leadId: lead.id,
      emailType,
      scheduledFor: scheduleByType[emailType],
      triggeredBy,
      idempotencyKey: jobKey(lead.id, emailType, inviteeUri),
      useHtml: params.htmlByType?.[emailType] ?? null,
    });
    if (job) {
      inserted += 1;
    }
  }

  if (inserted === 0) {
    return { started: false, reason: "no_jobs_inserted" };
  }

  await dispatchDueJobsForLead(lead.id);

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

async function prepareThreadedSend(
  job: BookingEmailJob,
  rendered: RenderedBookingEmail,
): Promise<{
  subject: string;
  headers?: Record<string, string>;
  threadSubject: string | null;
}> {
  if (!isThreadFollowUp(job.email_type)) {
    return {
      subject: rendered.subject,
      threadSubject: rendered.subject.trim() || null,
    };
  }

  const thread = await getThreadContext(
    job.lead_id,
    threadTypesForJob(job.email_type),
  );
  if (!thread.threadSubject || thread.messageIds.length === 0) {
    console.warn(
      `[booking-communication] Missing thread context for ${job.email_type} lead ${job.lead_id}`,
    );
    return { subject: rendered.subject, threadSubject: null };
  }

  return {
    subject: buildReplySubject(thread.threadSubject),
    headers: buildThreadHeaders(thread.messageIds),
    threadSubject: null,
  };
}

async function sendAndMarkJob(
  job: BookingEmailJob,
  lead: LinkTrackingLead,
  rendered: RenderedBookingEmail,
): Promise<boolean> {
  const threaded = await prepareThreadedSend(job, rendered);
  const result = await sendBookingEmail({
    to: lead.email,
    subject: threaded.subject,
    text: rendered.text,
    html: rendered.html,
    idempotencyKey: job.idempotency_key,
    headers: threaded.headers,
  });

  if (!result.ok) {
    await markJobFailed(job.id, result.error);
    return false;
  }

  await markJobSent(job.id, result.id, {
    messageId: result.messageId,
    threadSubject: threaded.threadSubject,
  });
  return true;
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
  return sendAndMarkJob(job, lead, rendered);
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
  const sent = await sendAndMarkJob(job, lead, rendered);
  if (!sent) {
    return false;
  }

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
  const confirmUrl =
    job.email_type === "role_seq_24"
      ? buildTemporaryConfirmUrl(lead.slug, lead.email)
      : confirmationAgenceLinkFor(lead);
  const useHtml = job.use_html ?? defaultUseHtml(job.email_type);
  return renderEmailFromStore({
    category: job.lead_category,
    emailType: job.email_type,
    firstName: lead.first_name,
    scheduledAt: lead.scheduled_at,
    confirmUrl,
    useHtml,
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
