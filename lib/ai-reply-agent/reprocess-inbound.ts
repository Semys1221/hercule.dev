import { isAutoSendEnabled, isCampaignConfigReady, loadAiReplyConfig } from "./config";
import { generateReplyDecision, interestLabelFromStatus } from "./grok";
import { truncateInboundText } from "./inbound";
import { buildKnowledgePack, hashKnowledgePack } from "./knowledge";
import { upsertLeadReply } from "./lead-replies";
import {
  insertOutboundMessage,
  updateInboundStatus,
} from "./messages";
import {
  applyReplyGate,
  INTERESTED_STATUS,
  isRecoveryInterestTag,
  NOT_INTERESTED_STATUS,
  NO_SHOW_STATUS,
} from "./reply-gate";
import { hasRecentHerculeCollision, sendAiReply } from "./send";
import { createAiReplyAgentClient } from "./supabase";
import {
  findLeadByEmailInCampaign,
  getInstantlyApiKey,
  updateLeadInterestStatusBypass,
} from "@/lib/instantly-bypass/client";
import { syncPipelineStepFromSentFlows } from "@/lib/instantly-bypass/sync-pipeline-from-events";
import { resolveBookingContext } from "./booking-context";
import { evaluateConversationGate } from "./conversation-gate";
import {
  fetchThreadMessages,
  formatThreadForGrok,
} from "./thread-context";
import {
  checkInterestedE1ReplyGate,
  resolveInboundEmailTimestamp,
} from "./e1-reply-gate";
import { detectOptOut } from "@/lib/lead-relances/opt-out";
import { hasOutboundSinceInbound } from "./send-mutex";

import type {
  AiReplyMessageStatus,
  HandleReplyResult,
} from "./types";

const REPROCESSABLE_STATUSES = new Set<AiReplyMessageStatus>([
  "pending",
  "failed",
  "skipped_not_interested",
  "skipped_recovery",
  "skipped_unsafe",
  "skipped_collision",
]);

const SKIP_REPROCESS_REASONS = new Set([
  "Lead marked No show in Instantly",
  "Lead marked Not interested in Instantly",
  "Opt-out détecté",
]);

type StoredInbound = {
  id: string;
  campaign_id: string;
  lead_email: string;
  body_text: string | null;
  subject: string | null;
  email_account: string | null;
  reply_to_uuid: string | null;
  instantly_email_id: string | null;
  ai_status: string | null;
  ai_reason: string | null;
  created_at: string | null;
};

function resolveLeadDisplayName(
  lead: { first_name?: string | null; last_name?: string | null } | null,
  leadEmail: string,
): string {
  const parts = [lead?.first_name, lead?.last_name]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return leadEmail;
}

async function findReprocessCandidate(
  campaignId: string,
  leadEmail: string,
): Promise<StoredInbound | null> {
  const client = createAiReplyAgentClient();
  const { data, error } = await client
    .from("ai_reply_agent_messages")
    .select(
      "id,campaign_id,lead_email,body_text,subject,email_account,reply_to_uuid,instantly_email_id,ai_status,ai_reason,created_at",
    )
    .eq("campaign_id", campaignId)
    .eq("lead_email", leadEmail.trim().toLowerCase())
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(`Failed to load inbound messages: ${error.message}`);
  }

  for (const row of data ?? []) {
    const status = String(row.ai_status ?? "") as AiReplyMessageStatus;
    const reason = String(row.ai_reason ?? "");
    if (status === "auto_replied") {
      if (!(await hasOutboundSinceInbound(campaignId, leadEmail, row.created_at))) {
        return row as StoredInbound;
      }
      continue;
    }
    if (!REPROCESSABLE_STATUSES.has(status)) {
      continue;
    }
    if (SKIP_REPROCESS_REASONS.has(reason)) {
      continue;
    }
    if (await hasOutboundSinceInbound(campaignId, leadEmail, row.created_at)) {
      continue;
    }
    return row as StoredInbound;
  }

  return null;
}

/**
 * Re-run Grok + auto-send for the latest unhandled post-E1 inbound.
 * Pre-E1 inbounds are never reprocessed — E1 is their answer.
 */
export async function reprocessInboundForLead(params: {
  campaignId: string;
  leadEmail: string;
}): Promise<HandleReplyResult> {
  const started = Date.now();
  const campaignId = params.campaignId.trim();
  const leadEmail = params.leadEmail.trim().toLowerCase();

  if (!campaignId || !leadEmail) {
    return { ok: false, error: "missing_campaign_or_lead_email" };
  }

  const config = await loadAiReplyConfig(campaignId);
  if (!config || !isCampaignConfigReady(config)) {
    return { ok: true, skipped: "config_not_ready" };
  }
  if (config.status !== "waiting_for_replies") {
    return { ok: true, skipped: "campaign_not_active" };
  }

  const inbound = await findReprocessCandidate(campaignId, leadEmail);
  if (!inbound) {
    return { ok: true, skipped: "no_candidate" };
  }

  const inboundText = String(inbound.body_text ?? "").trim() || "(empty body)";

  if (detectOptOut(inboundText)) {
    return { ok: true, skipped: "opt_out" };
  }

  const apiKey = getInstantlyApiKey();
  const lead = await findLeadByEmailInCampaign(apiKey, campaignId, leadEmail);
  const interestStatus = lead?.lt_interest_status ?? null;

  if (interestStatus === NO_SHOW_STATUS || interestStatus === NOT_INTERESTED_STATUS) {
    return { ok: true, skipped: "not_eligible_tag" };
  }

  if (interestStatus !== INTERESTED_STATUS && !isRecoveryInterestTag(interestStatus)) {
    return { ok: true, skipped: "not_interested_yet" };
  }

  if (!config.prompt_snapshot?.trim()) {
    return { ok: true, skipped: "missing_prompt" };
  }

  const inboundAt = await resolveInboundEmailTimestamp({
    instantlyEmailId: inbound.instantly_email_id,
    storedCreatedAt: inbound.created_at,
  });
  const e1ReplyGate = await checkInterestedE1ReplyGate({
    campaignId,
    leadEmail,
    interestStatus,
    inboundAt,
    inboundText,
  });
  if (!e1ReplyGate.allowReply) {
    const blockedStatus: AiReplyMessageStatus =
      e1ReplyGate.e1SentAt && inboundAt && inboundAt <= e1ReplyGate.e1SentAt
        ? "superseded_by_e1"
        : "skipped_waiting_e1";
    await updateInboundStatus(
      inbound.id,
      blockedStatus,
      e1ReplyGate.reason,
      null,
      null,
      Date.now() - started,
      null,
    );
    return {
      ok: true,
      skipped: "waiting_for_post_e1",
      aiStatus: blockedStatus,
    };
  }

  const conversationGate = await evaluateConversationGate({
    campaignId,
    leadEmail,
    inboundText,
  });
  if (conversationGate.skip) {
    await updateInboundStatus(
      inbound.id,
      "skipped_unsafe",
      conversationGate.reason,
      null,
      null,
      Date.now() - started,
      null,
    );
    return {
      ok: true,
      skipped: "conversation_closed",
      aiStatus: "skipped_unsafe",
    };
  }

  const knowledgePack = buildKnowledgePack(config);
  const knowledgePackHash = hashKnowledgePack(knowledgePack);
  const maxSentences = Math.max(1, Math.min(10, config.max_sentences ?? 2));
  const threadMessages = await fetchThreadMessages({
    campaignId,
    leadEmail,
    preferredEmailId:
      inbound.reply_to_uuid?.trim() ||
      inbound.instantly_email_id?.trim() ||
      undefined,
  }).catch(() => []);
  const threadContext = formatThreadForGrok(threadMessages);
  const bookingContext = await resolveBookingContext({
    campaignId,
    inboundText,
    leadEmail,
    leadName: resolveLeadDisplayName(lead, leadEmail),
    interestStatus,
  });

  let decision;
  let model: string;
  let costUsdTicks: number | null = null;
  try {
    const groq = await generateReplyDecision({
      knowledgePack,
      promptSnapshot: config.prompt_snapshot,
      inboundText: truncateInboundText(inboundText),
      leadEmail,
      targetType: config.target_type,
      nichePresetId: config.niche_preset_id,
      maxSentences,
      interestLabel: interestLabelFromStatus(interestStatus),
      bookingContext,
      threadContext,
    });
    decision = groq.decision;
    model = groq.model;
    costUsdTicks = groq.costUsdTicks;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateInboundStatus(
      inbound.id,
      "failed",
      message,
      null,
      null,
      Date.now() - started,
      knowledgePackHash,
    );
    return { ok: false, error: message, aiStatus: "failed" };
  }

  const gate = applyReplyGate(interestStatus, decision);
  if (!gate.allowReply) {
    await updateInboundStatus(
      inbound.id,
      gate.aiStatus,
      gate.reason,
      model,
      costUsdTicks,
      Date.now() - started,
      knowledgePackHash,
      decision.recovery_confidence ?? null,
    );
    return {
      ok: true,
      skipped: gate.aiStatus === "skipped_recovery" ? "recovery_gate" : "groq_abstain",
      aiStatus: gate.aiStatus,
    };
  }

  await upsertLeadReply(campaignId, leadEmail, decision.reply_text);

  if (!(await isAutoSendEnabled())) {
    await updateInboundStatus(
      inbound.id,
      "pending",
      decision.reason,
      model,
      costUsdTicks,
      Date.now() - started,
      knowledgePackHash,
      decision.recovery_confidence ?? null,
    );
    return { ok: true, aiStatus: "pending" };
  }

  if (await hasOutboundSinceInbound({ campaignId, leadEmail, inboundCreatedAt: inboundAt })) {
    await updateInboundStatus(
      inbound.id,
      "skipped_collision",
      "Outbound already sent for this inbound window",
      model,
      costUsdTicks,
      Date.now() - started,
      knowledgePackHash,
      decision.recovery_confidence ?? null,
    );
    return { ok: true, skipped: "send_mutex", aiStatus: "skipped_collision" };
  }

  const preferredEmailId =
    inbound.reply_to_uuid?.trim() ||
    inbound.instantly_email_id?.trim() ||
    undefined;

  try {
    const sent = await sendAiReply({
      config,
      campaignId,
      leadEmail,
      replyText: decision.reply_text,
      replySubject: inbound.subject ?? undefined,
      emailAccount: inbound.email_account ?? undefined,
      preferredEmailId,
    });

    await updateInboundStatus(
      inbound.id,
      "auto_replied",
      decision.reason,
      model,
      costUsdTicks,
      Date.now() - started,
      knowledgePackHash,
      decision.recovery_confidence ?? null,
    );
    await insertOutboundMessage({
      campaignId,
      leadEmail,
      bodyText: decision.reply_text,
      subject: inbound.subject,
      emailAccount: inbound.email_account,
      aiStatus: "auto_replied",
      aiReason: decision.reason,
      groqModel: model,
      replyToUuid: sent.replyToUuid,
    });

    if (isRecoveryInterestTag(interestStatus)) {
      await updateLeadInterestStatusBypass(apiKey, {
        lead_email: leadEmail,
        interest_value: INTERESTED_STATUS,
        campaign_id: campaignId,
      });
      await syncPipelineStepFromSentFlows(campaignId, leadEmail);
    }

    return { ok: true, aiStatus: "auto_replied", latencyMs: Date.now() - started };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateInboundStatus(
      inbound.id,
      "failed",
      message,
      model,
      costUsdTicks,
      Date.now() - started,
      knowledgePackHash,
      decision.recovery_confidence ?? null,
    );
    if (message === "thread_not_found") {
      return { ok: true, skipped: "thread_not_found", aiStatus: "failed" };
    }
    return { ok: false, error: message, aiStatus: "failed" };
  }
}
