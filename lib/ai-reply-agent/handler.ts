import { upsertLeadReply } from "./lead-replies";
import { isAutoSendEnabled, isCampaignConfigReady, loadAiReplyConfig } from "./config";
import { isHandledReplyAgentEvent, isOooReplyEvent } from "./events";
import { generateReplyDecision, interestLabelFromStatus } from "./grok";
import {
  inboundLooksLikePhoneRequest,
  inboundLooksLikeQuestion,
  inboundLooksLikeSchedulingAnswer,
} from "./inbound-question";
import { truncateInboundText } from "./inbound";
import { buildKnowledgePack, hashKnowledgePack } from "./knowledge";
import {
  bookFromInbound,
  formatBookingContextForGrok,
  type BookFromInboundMode,
} from "@/lib/calendly/book-from-inbound";
import { resolveCategoryForCampaign } from "@/lib/link-tracking/provision-campaign-lead";
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
} from "@/lib/instantly-bypass/client";
import { detectOptOut } from "@/lib/lead-relances/opt-out";
import { stopAllLeadRelances } from "@/lib/lead-relances/stop-all";
import { syncPipelineStepFromSentFlows } from "@/lib/instantly-bypass/sync-pipeline-from-events";
import {
  applyReplyGate,
  isRecoveryInterestTag,
  NOT_INTERESTED_STATUS,
  NO_SHOW_STATUS,
} from "./reply-gate";

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

async function resolveBookingContext(params: {
  campaignId: string;
  inboundText: string;
  leadEmail: string;
  leadName: string;
}): Promise<string | null> {
  try {
    const category = await resolveCategoryForCampaign(params.campaignId);
    if (category !== "comptable" && category !== "cif") {
      return null;
    }

    const mode: BookFromInboundMode = inboundLooksLikeSchedulingAnswer(
      params.inboundText,
    )
      ? "try_book"
      : inboundLooksLikePhoneRequest(params.inboundText)
        ? "suggest_slots"
        : "none";

    const result = await bookFromInbound({
      event: category,
      leadEmail: params.leadEmail,
      leadName: params.leadName,
      inboundText: params.inboundText,
      mode,
    });
    return formatBookingContextForGrok(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[ai-reply-agent] calendly booking failed:", message);
    return null;
  }
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

  const inbound = await insertInboundMessage({
    campaignId,
    leadEmail,
    eventType,
    instantlyEmailId,
    subject: payload.reply_subject?.trim() ?? null,
    bodyText: inboundText || "(empty body)",
    emailAccount: payload.email_account?.trim() ?? null,
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

  const recentCollision = await hasRecentHerculeCollision({ campaignId, leadEmail });
  if (recentCollision && !inboundLooksLikeQuestion(inboundText)) {
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

  const apiKey = getInstantlyApiKey();
  const lead = await findLeadByEmailInCampaign(apiKey, campaignId, leadEmail);
  const interestStatus = lead?.lt_interest_status ?? null;
  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "9923ed",
    },
    body: JSON.stringify({
      sessionId: "9923ed",
      runId: "pre-fix",
      hypothesisId: "A,E",
      location: "handler.ts:interest-status",
      message: "Resolved Instantly interest status before Grok gate",
      data: {
        leadEmail,
        campaignId,
        interestStatus,
        isNoShow: interestStatus === NO_SHOW_STATUS,
        isNotInterested: interestStatus === -1,
        isRecoveryTag: isRecoveryInterestTag(interestStatus),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
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
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "9923ed",
      },
      body: JSON.stringify({
        sessionId: "9923ed",
        runId: "post-fix",
        hypothesisId: "A",
        location: "handler.ts:skip-not-interested",
        message: "Skipped Grok for Not interested tag",
        data: { leadEmail, campaignId, interestStatus },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
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

  const knowledgePack = buildKnowledgePack(config);
  const knowledgePackHash = hashKnowledgePack(knowledgePack);
  const finalizeExtras = { knowledgePackHash };

  let decision;
  let model: string;
  let costUsdTicks: number | null = null;
  const maxSentences = Math.max(1, Math.min(10, config.max_sentences ?? 2));
  const bookingContext = await resolveBookingContext({
    campaignId,
    inboundText,
    leadEmail,
    leadName: resolveLeadDisplayName(lead, leadEmail),
  });
  try {
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "9923ed",
      },
      body: JSON.stringify({
        sessionId: "9923ed",
        runId: "pre-fix",
        hypothesisId: "A,B",
        location: "handler.ts:before-grok",
        message: "Calling generateReplyDecision (Grok reads inbound)",
        data: {
          leadEmail,
          interestStatus,
          interestLabel: interestLabelFromStatus(interestStatus),
          inboundPreview: truncateInboundText(inboundText || "(empty body)").slice(
            0,
            80,
          ),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
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
