import { upsertLeadReply } from "./lead-replies";
import { isAutoSendEnabled, isCampaignConfigReady, loadAiReplyConfig } from "./config";
import { isHandledReplyAgentEvent, isOooReplyEvent } from "./events";
import { generateReplyDecision } from "./grok";
import { truncateInboundText } from "./inbound";
import { buildKnowledgePack } from "./knowledge";
import {
  insertInboundMessage,
  insertOutboundMessage,
  updateInboundStatus,
} from "./messages";
import { hasRecentHerculeCollision, sendAiReply } from "./send";
import {
  findLeadByEmailInCampaign,
  getInstantlyApiKey,
} from "@/lib/instantly-bypass/client";

import type {
  HandleReplyResult,
  InstantlyReplyWebhookPayload,
} from "./types";

const INTERESTED_STATUS = 1;

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

  if (await hasRecentHerculeCollision({ campaignId, leadEmail })) {
    await updateInboundStatus(
      inbound.id,
      "skipped_collision",
      "Hercule already sent in-thread within 15 minutes",
    );
    return {
      ok: true,
      skipped: "collision_guard",
      aiStatus: "skipped_collision",
      latencyMs: Date.now() - started,
    };
  }

  const apiKey = getInstantlyApiKey();
  const lead = await findLeadByEmailInCampaign(apiKey, campaignId, leadEmail);
  const interestStatus = lead?.lt_interest_status ?? null;
  if (interestStatus !== INTERESTED_STATUS) {
    await updateInboundStatus(
      inbound.id,
      "skipped_not_interested",
      "Lead not tagged Interested",
    );
    return {
      ok: true,
      skipped: "not_interested",
      aiStatus: "skipped_not_interested",
      latencyMs: Date.now() - started,
    };
  }

  if (!config.prompt_snapshot?.trim()) {
    await updateInboundStatus(
      inbound.id,
      "skipped_unsafe",
      "Missing prompt_snapshot on campaign config",
    );
    return {
      ok: true,
      skipped: "missing_prompt",
      aiStatus: "skipped_unsafe",
      latencyMs: Date.now() - started,
    };
  }

  let decision;
  let model: string;
  let costUsdTicks: number | null = null;
  const maxSentences = Math.max(1, Math.min(10, config.max_sentences ?? 2));
  try {
    const groq = await generateReplyDecision({
      knowledgePack: buildKnowledgePack(config),
      promptSnapshot: config.prompt_snapshot,
      inboundText: truncateInboundText(inboundText || "(empty body)"),
      leadEmail,
      targetType: config.target_type,
      maxSentences,
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
    await updateInboundStatus(inbound.id, "failed", message);
    return { ok: false, error: message, aiStatus: "failed" };
  }

  if (!decision.should_reply || !decision.reply_text) {
    await updateInboundStatus(
      inbound.id,
      "skipped_unsafe",
      decision.reason,
      model,
      costUsdTicks,
    );
    return {
      ok: true,
      skipped: "groq_abstain",
      aiStatus: "skipped_unsafe",
      latencyMs: Date.now() - started,
    };
  }

  await upsertLeadReply(campaignId, leadEmail, decision.reply_text);

  if (!(await isAutoSendEnabled())) {
    await updateInboundStatus(inbound.id, "pending", decision.reason, model, costUsdTicks);
    return {
      ok: true,
      aiStatus: "pending",
      latencyMs: Date.now() - started,
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

    await updateInboundStatus(inbound.id, "auto_replied", decision.reason, model, costUsdTicks);
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

    return {
      ok: true,
      aiStatus: "auto_replied",
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateInboundStatus(inbound.id, "failed", message, model);
    if (message === "thread_not_found") {
      return { ok: true, skipped: "thread_not_found", aiStatus: "failed" };
    }
    return { ok: false, error: message, aiStatus: "failed" };
  }
}
