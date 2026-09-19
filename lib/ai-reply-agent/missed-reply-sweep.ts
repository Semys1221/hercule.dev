import { handleInstantlyReply } from "./handler";
import { createAiReplyAgentClient } from "./supabase";
import { isAutomatedSenderEmail, resolveReplyFromEmail } from "./reply-from-email";
import { INTERESTED_STATUS } from "./reply-gate";
import {
  findLeadByEmailInCampaign,
  getInstantlyApiKey,
  listEmails,
} from "@/lib/instantly-bypass/client";
import {
  getBypassEventSentAt,
  interestedIdempotencyKey,
} from "@/lib/instantly-bypass/jobs";
import { loadAiReplyConfig } from "./config";

import type { InstantlyEmailRecord } from "@/lib/instantly-bypass/types";
import type { InstantlyReplyWebhookPayload } from "./types";

export type MissedReplySweepResult = {
  scanned: number;
  recovered: number;
  skippedExisting: number;
  skippedAutomated: number;
  skippedSameSenderPreE1: number;
  skippedNotInterested: number;
  errors: number;
};

function normalizeEmail(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function readEmailBody(record: InstantlyEmailRecord & Record<string, unknown>): string {
  const body = record.body as { text?: string; html?: string } | undefined;
  const chunks = [
    body?.text,
    record.body_text as string | undefined,
    body?.html,
    record.body_html as string | undefined,
    record.content_preview as string | undefined,
  ];
  return chunks
    .filter((value): value is string => Boolean(value?.trim()))
    .join("\n");
}

function readEmailTimestamp(
  record: InstantlyEmailRecord & Record<string, unknown>,
): string | null {
  const timestamp =
    record.timestamp_email ?? record.timestamp_created ?? null;
  return typeof timestamp === "string" && timestamp.trim() ? timestamp : null;
}

async function inboundAlreadyRecorded(
  campaignId: string,
  instantlyEmailId: string,
): Promise<boolean> {
  const client = createAiReplyAgentClient();
  const { data, error } = await client
    .from("ai_reply_agent_messages")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("instantly_email_id", instantlyEmailId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check inbound idempotency: ${error.message}`);
  }
  return Boolean(data?.id);
}

function buildSyntheticPayload(params: {
  record: InstantlyEmailRecord & Record<string, unknown>;
  campaignId: string;
  leadEmail: string;
  replyFromEmail: string | null;
}): InstantlyReplyWebhookPayload {
  const bodyText = readEmailBody(params.record);
  const timestamp = readEmailTimestamp(params.record) ?? new Date().toISOString();
  return {
    timestamp,
    event_type: "reply_received",
    campaign_id: params.campaignId,
    lead_email: params.leadEmail,
    email_id: params.record.id,
    email_account: params.record.eaccount,
    reply_subject: params.record.subject,
    reply_text: bodyText,
    reply_from_email: params.replyFromEmail ?? undefined,
    from_address_email: params.replyFromEmail ?? undefined,
  };
}

async function shouldIngestReceivedEmail(params: {
  campaignId: string;
  leadEmail: string;
  fromAddress: string;
  emailTimestamp: string | null;
}): Promise<{ ingest: boolean; bucket: "alternate" | "same_sender_post_e1" | "same_sender_pre_e1" }> {
  const from = normalizeEmail(params.fromAddress);
  const lead = normalizeEmail(params.leadEmail);

  if (!from || isAutomatedSenderEmail(from)) {
    return { ingest: false, bucket: "same_sender_pre_e1" };
  }

  if (from !== lead) {
    return { ingest: true, bucket: "alternate" };
  }

  const e1SentAt = await getBypassEventSentAt(
    interestedIdempotencyKey(params.campaignId, params.leadEmail),
  );
  if (!e1SentAt) {
    return { ingest: false, bucket: "same_sender_pre_e1" };
  }

  const emailTimestamp = params.emailTimestamp;
  if (!emailTimestamp) {
    return { ingest: true, bucket: "same_sender_post_e1" };
  }

  if (Date.parse(emailTimestamp) > Date.parse(e1SentAt)) {
    return { ingest: true, bucket: "same_sender_post_e1" };
  }

  return { ingest: false, bucket: "same_sender_pre_e1" };
}

async function processReceivedRecord(params: {
  apiKey: string;
  campaignId: string;
  record: InstantlyEmailRecord & Record<string, unknown>;
  interestCache: Map<string, number | null | undefined>;
}): Promise<{
  outcome:
    | "recovered"
    | "skipped_existing"
    | "skipped_automated"
    | "skipped_same_sender_pre_e1"
    | "skipped_not_interested"
    | "error";
}> {
  const emailId = params.record.id?.trim();
  const leadEmail = normalizeEmail(params.record.lead);
  if (!emailId || !leadEmail) {
    return { outcome: "error" };
  }

  const fromAddress = normalizeEmail(
    (params.record as InstantlyEmailRecord & { from_address_email?: string })
      .from_address_email,
  );
  if (!fromAddress || isAutomatedSenderEmail(fromAddress)) {
    return { outcome: "skipped_automated" };
  }

  if (await inboundAlreadyRecorded(params.campaignId, emailId)) {
    return { outcome: "skipped_existing" };
  }

  let interestStatus = params.interestCache.get(leadEmail);
  if (interestStatus === undefined) {
    const lead = await findLeadByEmailInCampaign(
      params.apiKey,
      params.campaignId,
      leadEmail,
    );
    interestStatus = lead?.lt_interest_status ?? null;
    params.interestCache.set(leadEmail, interestStatus);
  }
  if (interestStatus !== INTERESTED_STATUS) {
    return { outcome: "skipped_not_interested" };
  }

  const ingestDecision = await shouldIngestReceivedEmail({
    campaignId: params.campaignId,
    leadEmail,
    fromAddress,
    emailTimestamp: readEmailTimestamp(params.record),
  });
  if (!ingestDecision.ingest) {
    return { outcome: "skipped_same_sender_pre_e1" };
  }

  const replyFromEmail = await resolveReplyFromEmail(params.apiKey, {
    payload: {
      from_address_email: fromAddress,
      reply_text: readEmailBody(params.record),
    },
    leadEmail,
    instantlyEmailId: emailId,
  });

  try {
    const synthetic = buildSyntheticPayload({
      record: params.record,
      campaignId: params.campaignId,
      leadEmail,
      replyFromEmail,
    });
    const handled = await handleInstantlyReply(synthetic);
    if (handled.ok) {
      return { outcome: "recovered" };
    }
    return { outcome: "error" };
  } catch {
    return { outcome: "error" };
  }
}

function applyOutcome(
  result: MissedReplySweepResult,
  outcome: Awaited<ReturnType<typeof processReceivedRecord>>["outcome"],
): void {
  switch (outcome) {
    case "recovered":
      result.recovered += 1;
      break;
    case "skipped_existing":
      result.skippedExisting += 1;
      break;
    case "skipped_automated":
      result.skippedAutomated += 1;
      break;
    case "skipped_same_sender_pre_e1":
      result.skippedSameSenderPreE1 += 1;
      break;
    case "skipped_not_interested":
      result.skippedNotInterested += 1;
      break;
    case "error":
      result.errors += 1;
      break;
  }
}

function emptyResult(): MissedReplySweepResult {
  return {
    scanned: 0,
    recovered: 0,
    skippedExisting: 0,
    skippedAutomated: 0,
    skippedSameSenderPreE1: 0,
    skippedNotInterested: 0,
    errors: 0,
  };
}

export type MissedIngestCandidate = {
  campaignId: string;
  leadEmail: string;
  instantlyEmailId: string;
  emailTimestamp: string | null;
  ageMinutes: number;
};

/**
 * Read-only: Instantly received emails that should already be in
 * ai_reply_agent_messages but are not (same filters as the sweep, no Grok/send).
 * Only includes emails with a known timestamp older than olderThanMinutes.
 */
export async function listMissedIngestCandidates(params: {
  campaignId: string;
  olderThanMinutes?: number;
  limit?: number;
}): Promise<MissedIngestCandidate[]> {
  const config = await loadAiReplyConfig(params.campaignId);
  if (!config || config.status !== "waiting_for_replies") {
    return [];
  }

  const olderThanMinutes = params.olderThanMinutes ?? 30;
  const limit = params.limit ?? 40;
  const apiKey = getInstantlyApiKey();
  const received = await listEmails(apiKey, {
    campaignId: params.campaignId,
    emailType: "received",
    limit,
  });

  const interestCache = new Map<string, number | null | undefined>();
  const candidates: MissedIngestCandidate[] = [];
  const now = Date.now();

  for (const raw of received) {
    const record = raw as InstantlyEmailRecord & Record<string, unknown>;
    const emailId = record.id?.trim();
    const leadEmail = normalizeEmail(record.lead);
    if (!emailId || !leadEmail) continue;

    const fromAddress = normalizeEmail(
      (record as InstantlyEmailRecord & { from_address_email?: string })
        .from_address_email,
    );
    if (!fromAddress || isAutomatedSenderEmail(fromAddress)) continue;

    if (await inboundAlreadyRecorded(params.campaignId, emailId)) continue;

    let interestStatus = interestCache.get(leadEmail);
    if (interestStatus === undefined) {
      const lead = await findLeadByEmailInCampaign(
        apiKey,
        params.campaignId,
        leadEmail,
      );
      interestStatus = lead?.lt_interest_status ?? null;
      interestCache.set(leadEmail, interestStatus);
    }
    if (interestStatus !== INTERESTED_STATUS) continue;

    const emailTimestamp = readEmailTimestamp(record);
    // Only alert when we can prove age > threshold (missing timestamp → skip).
    if (!emailTimestamp) continue;
    const parsed = Date.parse(emailTimestamp);
    if (Number.isNaN(parsed)) continue;
    const ageMinutes = (now - parsed) / (60 * 1000);
    if (ageMinutes <= olderThanMinutes) continue;

    const ingestDecision = await shouldIngestReceivedEmail({
      campaignId: params.campaignId,
      leadEmail,
      fromAddress,
      emailTimestamp,
    });
    if (!ingestDecision.ingest) continue;

    candidates.push({
      campaignId: params.campaignId,
      leadEmail,
      instantlyEmailId: emailId,
      emailTimestamp,
      ageMinutes: Math.floor(ageMinutes),
    });
  }

  return candidates;
}

/**
 * Recover Instantly received emails that never reached the reply-agent webhook.
 * Covers alternate senders (existing behaviour) and same-address post-E1 replies
 * that were left in skipped_waiting_e1 after E1 dispatch.
 */
export async function sweepMissedReplyInboxes(params: {
  campaignId: string;
  limit?: number;
}): Promise<MissedReplySweepResult> {
  const config = await loadAiReplyConfig(params.campaignId);
  if (!config || config.status !== "waiting_for_replies") {
    return emptyResult();
  }

  const apiKey = getInstantlyApiKey();
  const limit = params.limit ?? 40;
  const received = await listEmails(apiKey, {
    campaignId: params.campaignId,
    emailType: "received",
    limit,
  });

  const result: MissedReplySweepResult = {
    ...emptyResult(),
    scanned: received.length,
  };
  const interestCache = new Map<string, number | null | undefined>();

  for (const record of received) {
    const outcome = await processReceivedRecord({
      apiKey,
      campaignId: params.campaignId,
      record: record as InstantlyEmailRecord & Record<string, unknown>,
      interestCache,
    });
    applyOutcome(result, outcome.outcome);
  }

  return result;
}

/** Targeted recovery for one lead — run right after E1 dispatch. */
export async function sweepMissedRepliesForLead(params: {
  campaignId: string;
  leadEmail: string;
  limit?: number;
}): Promise<MissedReplySweepResult> {
  const campaignId = params.campaignId.trim();
  const leadEmail = params.leadEmail.trim().toLowerCase();
  if (!campaignId || !leadEmail) {
    return emptyResult();
  }

  const config = await loadAiReplyConfig(campaignId);
  if (!config || config.status !== "waiting_for_replies") {
    return emptyResult();
  }

  const apiKey = getInstantlyApiKey();
  const received = await listEmails(apiKey, {
    campaignId,
    emailType: "received",
    search: leadEmail,
    limit: params.limit ?? 20,
  });

  const result: MissedReplySweepResult = {
    ...emptyResult(),
    scanned: received.length,
  };
  const interestCache = new Map<string, number | null | undefined>();

  for (const record of received) {
    if (normalizeEmail(record.lead) !== leadEmail) {
      continue;
    }
    const outcome = await processReceivedRecord({
      apiKey,
      campaignId,
      record: record as InstantlyEmailRecord & Record<string, unknown>,
      interestCache,
    });
    applyOutcome(result, outcome.outcome);
  }

  return result;
}
