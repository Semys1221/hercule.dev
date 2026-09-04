import {
  findLeadByEmailInCampaign,
  getInstantlyApiKey,
  removeLeadFromSubsequence,
  replyToEmail,
  updateLeadInterestStatusBypass,
} from "./client";
import {
  hasBypassEvent,
  interestedIdempotencyKey,
  recordBypassEvent,
} from "./jobs";
import { resolveThreadForReply } from "./thread-resolver";
import {
  buildTemplateVariables,
  loadBypassConfig,
  loadTemplate,
  renderTemplate,
  waitingForReplyInterestValue,
} from "./templates";

import type { HandleInterestedResult, InstantlyWebhookPayload } from "./types";

export async function handleLeadInterested(
  payload: InstantlyWebhookPayload,
): Promise<HandleInterestedResult> {
  const campaignId = payload.campaign_id?.trim();
  const leadEmail = payload.lead_email?.trim().toLowerCase();

  if (!campaignId || !leadEmail) {
    return { ok: false, error: "missing_campaign_or_lead_email" };
  }

  const apiKey = getInstantlyApiKey();
  const idempotencyKey = interestedIdempotencyKey(campaignId, leadEmail);

  if (await hasBypassEvent(idempotencyKey)) {
    return { ok: true, skipped: "already_sent" };
  }

  const webhookReceivedAt = payload.timestamp
    ? new Date(payload.timestamp)
    : new Date();

  try {
    const template = await loadTemplate("interested_email1");
    const lead = await findLeadByEmailInCampaign(apiKey, campaignId, leadEmail);

    if (lead?.id && lead.subsequence_id) {
      await removeLeadFromSubsequence(apiKey, lead.id);
    }

    const thread = await resolveThreadForReply(apiKey, {
      leadEmail,
      campaignId,
      fallbackEaccount: payload.email_account as string | undefined,
      preferredEmailId: payload.email_id as string | undefined,
    });

    if (!thread) {
      await recordBypassEvent({
        idempotencyKey,
        flow: "interested_email1",
        campaignId,
        leadEmail,
        leadId: lead?.id,
        webhookReceivedAt,
        status: "failed",
        errorMessage: "Could not resolve Unibox thread for inline reply",
      });
      return { ok: false, error: "thread_not_found" };
    }

    const vars = buildTemplateVariables(
      {
        ...payload,
        subject: thread.subject ?? payload.reply_subject,
        reply_subject: payload.reply_subject,
      },
      lead ?? undefined,
    );

    const rendered = renderTemplate(template, vars);
    const subject = rendered.subject.startsWith("Re:")
      ? rendered.subject
      : `Re: ${rendered.subject.replace(/^Re:\s*/i, "")}`;

    await replyToEmail(apiKey, {
      eaccount: thread.eaccount,
      replyToUuid: thread.replyToUuid,
      subject,
      html: rendered.html,
    });

    const dispatchedAt = new Date();
    const latencyMs = dispatchedAt.getTime() - webhookReceivedAt.getTime();

    const config = await loadBypassConfig(campaignId);
    const interestValue =
      config?.waiting_for_reply_interest_value ?? waitingForReplyInterestValue();
    if (interestValue !== null) {
      await updateLeadInterestStatusBypass(apiKey, {
        lead_email: leadEmail,
        campaign_id: campaignId,
        interest_value: interestValue,
        disable_auto_interest: true,
      });
    }

    await recordBypassEvent({
      idempotencyKey,
      flow: "interested_email1",
      campaignId,
      leadEmail,
      leadId: lead?.id,
      webhookReceivedAt,
      dispatchedAt,
      latencyMs,
      status: "sent",
      replyToUuid: thread.replyToUuid,
    });

    return {
      ok: true,
      latencyMs,
      replyToUuid: thread.replyToUuid,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await recordBypassEvent({
      idempotencyKey,
      flow: "interested_email1",
      campaignId,
      leadEmail,
      webhookReceivedAt,
      status: "failed",
      errorMessage: message,
    });
    return { ok: false, error: message };
  }
}
