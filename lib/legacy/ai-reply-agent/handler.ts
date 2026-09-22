import { upsertLeadReply } from "./lead-replies";
import { isAutoSendEnabled, isCampaignConfigReady, loadAiReplyConfig } from "./config";
import {
  isCalendlySystemEmail,
  isCaptchaOrBounceEmail,
  isHandledReplyAgentEvent,
  isOooReplyEvent,
} from "./events";
import { generateReplyDecision, interestLabelFromStatus } from "./grok";
import { truncateInboundText } from "./inbound";
import { buildKnowledgePack, hashKnowledgePack } from "./knowledge";
import { resolveBookingContext } from "./booking-context";
import { evaluateConversationGate } from "./conversation-gate";
import { inboundNeedsFollowUp } from "./inbound-question";
import {
  fetchThreadMessages,
  formatThreadForGrok,
} from "./thread-context";
import {
  insertInboundMessage,
  insertOutboundMessage,
  updateInboundStatus,
} from "./messages";
import { hasRecentHerculeCollision, sendAiReply } from "./send";
import {
  findLeadByEmailInCampaign,
  getInstantlyApiKey,
  updateLeadInterestStatusBypass,
} from "@/lib/legacy/instantly-bypass/client";
import { detectOptOut } from "@/lib/legacy/lead-relances/opt-out";
import { stopAllLeadRelances } from "@/lib/legacy/lead-relances/stop-all";
import { syncPipelineStepFromSentFlows } from "@/lib/legacy/instantly-bypass/sync-pipeline-from-events";
import {
  applyReplyGate,
  INTERESTED_STATUS,
  isRecoveryInterestTag,
  NOT_INTERESTED_STATUS,
  NO_SHOW_STATUS,
} from "./reply-gate";
import {
  checkInterestedE1ReplyGate,
  resolveInboundEmailTimestamp,
} from "./e1-reply-gate";
import { evaluatePostE1InterestGate } from "./post-e1-gate";
import { hasOutboundSinceInbound } from "./send-mutex";
import { ensureInterestedE1IfMissing } from "@/lib/legacy/instantly-bypass/ensure-interested-e1";
import {
  isReplyAgentProtectedClient,
  REPLY_AGENT_CLIENT_SKIP_REASON,
} from "./client-guard";
import {
  resolveReplyFromEmail,
  syncLeadReplyFromEmail,
} from "./reply-from-email";

import type {
  AiReplyMessageStatus,
  HandleReplyResult,
  InstantlyReplyWebhookPayload,
} from "./types";

type InboundFinalizeExtras = {
  groqModel?: string | null;
  groqCostUsdTicks?: number | null;
  knowledgePackHash?: string | null;
  recoveryConfidence?: number | null;
};

async function finalizeInbound(
  messageId: string,
  aiStatus: AiReplyMessageStatus,
  started: number,
  aiReason?: string | null,
  extras?: InboundFinalizeExtras,
): Promise<number> {
  const latencyMs = Date.now() - started;
  await updateInboundStatus(
    messageId,
    aiStatus,
    aiReason,
    extras?.groqModel,
    extras?.groqCostUsdTicks,
    latencyMs,
    extras?.knowledgePackHash,
    extras?.recoveryConfidence,
  );
  return latencyMs;
}

async function retagLeadInterested(
  apiKey: string,
  campaignId: string,
  leadEmail: string,
): Promise<void> {
  try {
    await updateLeadInterestStatusBypass(apiKey, {
      lead_email: leadEmail,
      interest_value: 1,
      campaign_id: campaignId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[ai-reply-agent] failed to retag ${leadEmail} as Interested:`,
      message,
    );
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readInboundText(payload: InstantlyReplyWebhookPayload): string {
  const text = payload.reply_text?.trim();
  if (text) return text;
  const html = payload.reply_html?.trim();
  if (html) return stripHtml(html);
  return payload.reply_text_snippet?.trim() ?? "";
}

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

export async function handleInstantlyReply(
  payload: InstantlyReplyWebhookPayload,
): Promise<HandleReplyResult> {
  const started = Date.now();
  const eventType = payload.event_type?.trim() ?? "";
  const campaignId = payload.campaign_id?.trim();
  const leadEmail = payload.lead_email?.trim().toLowerCase();

  if (!campaignId || !leadEmail) {
    return { ok: false, error: "missing_campaign_or_lead_email" };
  }

  if (!isHandledReplyAgentEvent(eventType)) {
    return { ok: true, skipped: "ignored_event_type" };
  }

  const config = await loadAiReplyConfig(campaignId);
  if (!config) {
    return { ok: true, skipped: "campaign_not_initialized" };
  }
  if (!isCampaignConfigReady(config)) {
    return { ok: true, skipped: "config_not_ready" };
  }
  if (config.status !== "waiting_for_replies") {
    return { ok: true, skipped: "campaign_not_active" };
  }

  const inboundText = readInboundText(payload);
  const instantlyEmailId = payload.email_id?.trim() ?? null;
  const isOoo = isOooReplyEvent(eventType);
  const apiKey = getInstantlyApiKey();
  const replyFromEmail = await resolveReplyFromEmail(apiKey, {
    payload,
    leadEmail,
    instantlyEmailId,
  });

  if (replyFromEmail && replyFromEmail !== leadEmail) {
    await syncLeadReplyFromEmail(apiKey, {
      campaignId,
      leadEmail,
      replyFromEmail,
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        `[ai-reply-agent] failed to sync reply_from_email for ${leadEmail}:`,
        message,
      );
    });
  }

  const inbound = await insertInboundMessage({
    campaignId,
    leadEmail,
    eventType,
    instantlyEmailId,
    subject: payload.reply_subject?.trim() ?? null,
    bodyText: inboundText || "(empty body)",
    emailAccount: payload.email_account?.trim() ?? null,
    replyFromEmail,
    uniboxUrl: payload.unibox_url?.trim() ?? null,
    aiStatus: isOoo ? "skipped_ooo" : "pending",
    aiReason: isOoo ? "Auto-reply / out-of-office detected" : null,
    replyToUuid: instantlyEmailId,
  });

  if (inbound.duplicate) {
    return { ok: true, skipped: "duplicate_event" };
  }

  if (isOoo) {
    return {
      ok: true,
      skipped: "auto_reply_received",
      aiStatus: "skipped_ooo",
      latencyMs: Date.now() - started,
    };
  }

  if (isCalendlySystemEmail(inboundText)) {
    const latencyMs = await finalizeInbound(
      inbound.id,
      "skipped_calendly_system",
      started,
      "Notification Calendly système — aucune réponse requise",
    );
    return {
      ok: true,
      skipped: "calendly_system",
      aiStatus: "skipped_calendly_system",
      latencyMs,
    };
  }

  if (isCaptchaOrBounceEmail(inboundText)) {
    const latencyMs = await finalizeInbound(
      inbound.id,
      "skipped_ooo",
      started,
      "Message technique (captcha / non-délivrance) — ignoré",
    );
    return {
      ok: true,
      skipped: "technical_delivery",
      aiStatus: "skipped_ooo",
      latencyMs,
    };
  }

  if (await isReplyAgentProtectedClient(leadEmail)) {
    const latencyMs = await finalizeInbound(
      inbound.id,
      "skipped_not_interested",
      started,
      REPLY_AGENT_CLIENT_SKIP_REASON,
    );
    return {
      ok: true,
      skipped: "paying_client",
      aiStatus: "skipped_not_interested",
      latencyMs,
    };
  }

  const recentCollision = await hasRecentHerculeCollision({ campaignId, leadEmail });
  const needsFollowUp = inboundNeedsFollowUp(inboundText);
  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "51a42e",
    },
    body: JSON.stringify({
      sessionId: "51a42e",
      runId: "pre-fix",
      hypothesisId: "A-B",
      location: "handler.ts:collision-guard",
      message: "Follow-up and collision evaluation",
      data: {
        leadEmail,
        needsFollowUp,
        recentCollision,
        inboundPreview: inboundText.slice(0, 80),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (recentCollision && !needsFollowUp) {
    const latencyMs = await finalizeInbound(
      inbound.id,
      "skipped_collision",
      started,
      "Hercule already sent in-thread within 15 minutes",
    );
    return {
      ok: true,
      skipped: "collision_guard",
      aiStatus: "skipped_collision",
      latencyMs,
    };
  }

  const lead = await findLeadByEmailInCampaign(apiKey, campaignId, leadEmail);
  const interestStatus = lead?.lt_interest_status ?? null;
  if (interestStatus === NO_SHOW_STATUS) {
    const latencyMs = await finalizeInbound(
      inbound.id,
      "skipped_not_interested",
      started,
      "Lead marked No show in Instantly",
    );
    return {
      ok: true,
      skipped: "no_show",
      aiStatus: "skipped_not_interested",
      latencyMs,
    };
  }

  if (interestStatus === NOT_INTERESTED_STATUS) {
    const latencyMs = await finalizeInbound(
      inbound.id,
      "skipped_not_interested",
      started,
      "Lead marked Not interested in Instantly",
    );
    return {
      ok: true,
      skipped: "not_interested",
      aiStatus: "skipped_not_interested",
      latencyMs,
    };
  }

  if (detectOptOut(inboundText)) {
    await stopAllLeadRelances({
      leadEmail,
      campaignId,
      reason: "opt-out inbound",
    });
    const latencyMs = await finalizeInbound(
      inbound.id,
      "skipped_not_interested",
      started,
      "Opt-out détecté",
    );
    return {
      ok: true,
      skipped: "opt_out",
      aiStatus: "skipped_not_interested",
      latencyMs,
    };
  }

  if (!config.prompt_snapshot?.trim()) {
    const latencyMs = await finalizeInbound(
      inbound.id,
      "skipped_unsafe",
      started,
      "Missing prompt_snapshot on campaign config",
    );
    return {
      ok: true,
      skipped: "missing_prompt",
      aiStatus: "skipped_unsafe",
      latencyMs,
    };
  }

  if (interestStatus === INTERESTED_STATUS) {
    await ensureInterestedE1IfMissing({
      campaignId,
      leadEmail,
      emailAccount: payload.email_account?.trim(),
      firstName: lead?.first_name ?? undefined,
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        `[ai-reply-agent] ensure E1 failed for ${leadEmail}:`,
        message,
      );
      return { ok: false as const, error: message };
    });
  }

  const inboundAt = await resolveInboundEmailTimestamp({
    instantlyEmailId,
    webhookTimestamp: payload.timestamp,
  });
  const e1ReplyGate = await checkInterestedE1ReplyGate({
    campaignId,
    leadEmail,
    interestStatus,
    inboundAt,
    inboundText,
  });
  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "7d80e9",
    },
    body: JSON.stringify({
      sessionId: "7d80e9",
      runId: "post-fix",
      hypothesisId: "E1-GATE",
      location: "handler.ts:e1-reply-gate",
      message: "E1 reply gate evaluated",
      data: {
        allowReply: e1ReplyGate.allowReply,
        reason: e1ReplyGate.reason,
        inboundAt,
        e1SentAt: e1ReplyGate.e1SentAt,
        interestStatus,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (!e1ReplyGate.allowReply) {
    const blockedStatus: AiReplyMessageStatus =
      e1ReplyGate.e1SentAt && inboundAt && inboundAt <= e1ReplyGate.e1SentAt
        ? "superseded_by_e1"
        : "skipped_waiting_e1";
    const latencyMs = await finalizeInbound(
      inbound.id,
      blockedStatus,
      started,
      e1ReplyGate.reason,
    );
    return {
      ok: true,
      skipped: "waiting_for_post_e1",
      aiStatus: blockedStatus,
      latencyMs,
    };
  }

  const postE1Gate = evaluatePostE1InterestGate({
    e1ReplyGate,
    inboundText,
  });
  if (postE1Gate.skip) {
    const latencyMs = await finalizeInbound(
      inbound.id,
      "skipped_post_e1_ack",
      started,
      postE1Gate.reason,
    );
    return {
      ok: true,
      skipped: "post_e1_pure_interest",
      aiStatus: "skipped_post_e1_ack",
      latencyMs,
    };
  }

  const conversationGate = await evaluateConversationGate({
    campaignId,
    leadEmail,
    replyFromEmail,
    inboundText,
  });
  if (conversationGate.skip) {
    const latencyMs = await finalizeInbound(
      inbound.id,
      "skipped_unsafe",
      started,
      conversationGate.reason,
    );
    return {
      ok: true,
      skipped: "conversation_closed",
      aiStatus: "skipped_unsafe",
      latencyMs,
    };
  }

  const knowledgePack = buildKnowledgePack(config);
  const knowledgePackHash = hashKnowledgePack(knowledgePack);
  const finalizeExtras = { knowledgePackHash };

  const threadMessages = await fetchThreadMessages({
    campaignId,
    leadEmail,
    preferredEmailId: instantlyEmailId,
  }).catch(() => []);
  const threadContext = formatThreadForGrok(threadMessages);

  let decision;
  let model: string;
  let costUsdTicks: number | null = null;
  const maxSentences = Math.max(1, Math.min(10, config.max_sentences ?? 2));
  const bookingContext = await resolveBookingContext({
    campaignId,
    inboundText,
    leadEmail,
    replyFromEmail,
    leadName: resolveLeadDisplayName(lead, leadEmail),
    interestStatus,
    threadContext,
  });
  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "51a42e",
    },
    body: JSON.stringify({
      sessionId: "51a42e",
      runId: "pre-fix",
      hypothesisId: "E",
      location: "handler.ts:booking-context",
      message: "Booking context resolved",
      data: {
        leadEmail,
        hasBookingContext: Boolean(bookingContext),
        bookingContextPreview: bookingContext?.slice(0, 120) ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  try {
    const groq = await generateReplyDecision({
      knowledgePack,
      promptSnapshot: config.prompt_snapshot,
      inboundText: truncateInboundText(inboundText || "(empty body)"),
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
    if (costUsdTicks != null) {
      console.info(
        `[ai-reply-agent] grok cost ticks=${costUsdTicks} model=${model} campaign=${campaignId}`,
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const latencyMs = await finalizeInbound(
      inbound.id,
      "failed",
      started,
      message,
      finalizeExtras,
    );
    return { ok: false, error: message, aiStatus: "failed", latencyMs };
  }

  const grokFinalizeExtras: InboundFinalizeExtras = {
    ...finalizeExtras,
    groqModel: model,
    groqCostUsdTicks: costUsdTicks,
    recoveryConfidence: decision.recovery_confidence ?? null,
  };

  const gate = applyReplyGate(interestStatus, decision);
  if (!gate.allowReply) {
    const latencyMs = await finalizeInbound(
      inbound.id,
      gate.aiStatus,
      started,
      gate.reason,
      grokFinalizeExtras,
    );
    return {
      ok: true,
      skipped: gate.aiStatus === "skipped_recovery" ? "recovery_gate" : "groq_abstain",
      aiStatus: gate.aiStatus,
      latencyMs,
    };
  }

  await upsertLeadReply(campaignId, leadEmail, decision.reply_text);

  if (!(await isAutoSendEnabled())) {
    const latencyMs = await finalizeInbound(
      inbound.id,
      "pending",
      started,
      decision.reason,
      grokFinalizeExtras,
    );
    return {
      ok: true,
      aiStatus: "pending",
      latencyMs,
    };
  }

  if (await hasOutboundSinceInbound({ campaignId, leadEmail, inboundCreatedAt: inboundAt })) {
    const latencyMs = await finalizeInbound(
      inbound.id,
      "skipped_collision",
      started,
      "Outbound already sent for this inbound window",
      grokFinalizeExtras,
    );
    return {
      ok: true,
      skipped: "send_mutex",
      aiStatus: "skipped_collision",
      latencyMs,
    };
  }

  try {
    const sent = await sendAiReply({
      config,
      campaignId,
      leadEmail,
      replyText: decision.reply_text,
      replySubject: payload.reply_subject,
      emailAccount: payload.email_account,
      preferredEmailId: instantlyEmailId ?? undefined,
    });

    const latencyMs = await finalizeInbound(
      inbound.id,
      "auto_replied",
      started,
      decision.reason,
      grokFinalizeExtras,
    );
    await insertOutboundMessage({
      campaignId,
      leadEmail,
      bodyText: decision.reply_text,
      subject: payload.reply_subject ?? null,
      emailAccount: payload.email_account ?? null,
      aiStatus: "auto_replied",
      aiReason: decision.reason,
      groqModel: model,
      replyToUuid: sent.replyToUuid,
    });

    if (isRecoveryInterestTag(interestStatus)) {
      await retagLeadInterested(apiKey, campaignId, leadEmail);
      await syncPipelineStepFromSentFlows(campaignId, leadEmail);
    }

    return {
      ok: true,
      aiStatus: "auto_replied",
      latencyMs,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const latencyMs = await finalizeInbound(
      inbound.id,
      "failed",
      started,
      message,
      grokFinalizeExtras,
    );
    if (message === "thread_not_found") {
      return { ok: true, skipped: "thread_not_found", aiStatus: "failed", latencyMs };
    }
    return { ok: false, error: message, aiStatus: "failed", latencyMs };
  }
}
