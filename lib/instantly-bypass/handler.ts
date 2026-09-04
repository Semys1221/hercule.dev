import {
  findLeadByEmailInCampaign,
  getInstantlyApiKey,
  replyToEmail,
} from "./client";
import { threadAlreadyHasE1 } from "./e1-thread-guard";
import {
  hasBypassEvent,
  interestedIdempotencyKey,
  recordBypassEvent,
} from "./jobs";
import { resolveThreadForReply } from "./thread-resolver";
import {
  buildTemplateVariables,
  isTemplateBodyEmpty,
  loadBypassConfig,
  loadTemplate,
  renderTemplate,
  templateRequiresReservationLink,
} from "./templates";

import { upsertPipelineStep } from "./pipeline";

import type { HandleInterestedResult, InstantlyWebhookPayload } from "./types";

function readReservationLink(
  lead?: { payload?: Record<string, unknown> | null },
  payload?: Record<string, unknown>,
): string | null {
  const fromPayload = payload?.reservation_agence_link;
  if (typeof fromPayload === "string" && fromPayload.trim()) {
    return fromPayload.trim();
  }
  const leadPayload = lead?.payload ?? {};
  const fromLead = leadPayload.reservation_agence_link;
  if (typeof fromLead === "string" && fromLead.trim()) {
    return fromLead.trim();
  }
  return null;
}

export async function handleLeadInterested(
  payload: InstantlyWebhookPayload,
): Promise<HandleInterestedResult> {
  const campaignId = payload.campaign_id?.trim();
  const leadEmail = payload.lead_email?.trim().toLowerCase();

  if (!campaignId || !leadEmail) {
    return { ok: false, error: "missing_campaign_or_lead_email" };
  }

  const config = await loadBypassConfig(campaignId);
  if (!config) {
    return { ok: true, skipped: "campaign_not_initialized" };
  }
  if (config.webhook_auto_send_enabled === false) {
    return { ok: true, skipped: "campaign_webhook_paused" };
  }

  const apiKey = getInstantlyApiKey();
  const idempotencyKey = interestedIdempotencyKey(campaignId, leadEmail);

  if (await hasBypassEvent(idempotencyKey)) {
    await upsertPipelineStep(campaignId, leadEmail, "step_1");
    return { ok: true, skipped: "already_sent" };
  }

  const webhookReceivedAt = payload.timestamp
    ? new Date(payload.timestamp)
    : new Date();

  try {
    await upsertPipelineStep(campaignId, leadEmail, "step_0");

    const lead = await findLeadByEmailInCampaign(apiKey, campaignId, leadEmail);
    const template = await loadTemplate(campaignId, "interested_email1");

    if (isTemplateBodyEmpty(template.body_html)) {
      await recordBypassEvent({
        idempotencyKey,
        flow: "interested_email1",
        campaignId,
        leadEmail,
        leadId: lead?.id,
        webhookReceivedAt,
        status: "failed",
        errorMessage: "Empty interested_email1 template",
      });
      return { ok: false, error: "template_empty" };
    }

    if (
      templateRequiresReservationLink(template.body_html) &&
      !readReservationLink(lead ?? undefined, payload)
    ) {
      await recordBypassEvent({
        idempotencyKey,
        flow: "interested_email1",
        campaignId,
        leadEmail,
        leadId: lead?.id,
        webhookReceivedAt,
        status: "failed",
        errorMessage: "Missing reservation_agence_link on lead",
      });
      return { ok: false, error: "missing_reservation_link" };
    }

    if (await threadAlreadyHasE1(apiKey, { leadEmail, campaignId })) {
      await recordBypassEvent({
        idempotencyKey,
        flow: "interested_email1",
        campaignId,
        leadEmail,
        leadId: lead?.id,
        webhookReceivedAt,
        status: "skipped",
        errorMessage: "E1 already present in Unibox thread",
      });
      await upsertPipelineStep(campaignId, leadEmail, "step_1");
      return { ok: true, skipped: "e1_already_in_thread" };
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

    const vars = buildTemplateVariables(payload, lead ?? undefined);
    const rendered = renderTemplate(template, vars);
    const subject = thread.subject?.trim() || rendered.subject || "your message";

    await replyToEmail(apiKey, {
      eaccount: thread.eaccount,
      replyToUuid: thread.replyToUuid,
      subject,
      html: rendered.html,
    });

    const dispatchedAt = new Date();
    const latencyMs = dispatchedAt.getTime() - webhookReceivedAt.getTime();

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

    await upsertPipelineStep(campaignId, leadEmail, "step_1");

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
