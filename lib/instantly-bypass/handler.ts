import { findLeadByEmailInCampaign, getInstantlyApiKey } from "./client";
import { e1WebhookScheduledFor } from "./constants";
import { threadAlreadyHasE1 } from "./e1-thread-guard";
import {
  hasBypassEvent,
  interestedIdempotencyKey,
  recordBypassEvent,
} from "./jobs";
import { upsertPipelineStep } from "./pipeline";
import { dispatchBypassJobByIdempotencyKey } from "./dispatch-scheduled";
import { insertBypassJob } from "./scheduled-jobs";
import { ensureCampaignLeadLinks } from "@/lib/link-tracking/provision-campaign-lead";
import { readReservationLink, templateRequiresReservationLink } from "./reservation-links";
import { isTemplateBodyEmpty, loadBypassConfig, loadTemplate } from "./templates";

import { reprocessInboundForLead } from "@/lib/ai-reply-agent/reprocess-inbound";

import type { HandleInterestedResult, InstantlyWebhookPayload } from "./types";

function debugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
): void {
  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "3be66b",
    },
    body: JSON.stringify({
      sessionId: "3be66b",
      location,
      message,
      data,
      timestamp: Date.now(),
      runId: "pre-fix",
      hypothesisId,
    }),
  }).catch(() => {});
  // #endregion
}

async function triggerReplyReprocessAfterInterested(
  campaignId: string,
  leadEmail: string,
  e1Outcome?: string,
): Promise<void> {
  const replyReprocess = await reprocessInboundForLead({ campaignId, leadEmail }).catch(
    (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        `[instantly-bypass] reply reprocess failed for ${leadEmail}:`,
        message,
      );
      return { ok: false as const, error: message };
    },
  );

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "3903b6",
    },
    body: JSON.stringify({
      sessionId: "3903b6",
      runId: "post-fix",
      hypothesisId: "A,B",
      location: "lib/instantly-bypass/handler.ts:reply-reprocess",
      message: "Reply reprocess after lead_interested",
      data: {
        campaignId,
        leadEmail,
        e1Outcome: e1Outcome ?? null,
        replySkipped: "skipped" in replyReprocess ? replyReprocess.skipped : null,
        replyAiStatus: "aiStatus" in replyReprocess ? replyReprocess.aiStatus : null,
        replyError: "error" in replyReprocess ? replyReprocess.error : null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

async function recordSkippedInterested(
  params: {
    idempotencyKey: string;
    campaignId: string;
    leadEmail: string;
    webhookReceivedAt: Date;
    errorMessage: string;
  },
): Promise<void> {
  await recordBypassEvent({
    idempotencyKey: params.idempotencyKey,
    flow: "interested_email1",
    campaignId: params.campaignId,
    leadEmail: params.leadEmail,
    webhookReceivedAt: params.webhookReceivedAt,
    status: "skipped",
    errorMessage: params.errorMessage,
  }).catch(() => undefined);
}

export async function handleLeadInterested(
  payload: InstantlyWebhookPayload,
  options?: { skipReplyReprocess?: boolean },
): Promise<HandleInterestedResult> {
  const campaignId = payload.campaign_id?.trim();
  const leadEmail = payload.lead_email?.trim().toLowerCase();

  if (!campaignId || !leadEmail) {
    debugLog(
      "lib/instantly-bypass/handler.ts:entry",
      "Missing campaign or lead email",
      { campaignId: campaignId ?? null, leadEmail: leadEmail ?? null },
      "D",
    );
    return { ok: false, error: "missing_campaign_or_lead_email" };
  }

  const webhookReceivedAt = payload.timestamp
    ? new Date(payload.timestamp)
    : new Date();
  const idempotencyKey = interestedIdempotencyKey(campaignId, leadEmail);

  const config = await loadBypassConfig(campaignId);
  if (!config) {
    debugLog(
      "lib/instantly-bypass/handler.ts:config",
      "Campaign bypass config missing",
      { campaignId, leadEmail },
      "B",
    );
    await recordSkippedInterested({
      idempotencyKey,
      campaignId,
      leadEmail,
      webhookReceivedAt,
      errorMessage: "campaign_not_initialized",
    });
    return { ok: true, skipped: "campaign_not_initialized" };
  }
  if (config.webhook_auto_send_enabled === false) {
    debugLog(
      "lib/instantly-bypass/handler.ts:config",
      "Campaign webhook auto-send paused",
      { campaignId, leadEmail },
      "B",
    );
    await recordSkippedInterested({
      idempotencyKey,
      campaignId,
      leadEmail,
      webhookReceivedAt,
      errorMessage: "campaign_webhook_paused",
    });
    return { ok: true, skipped: "campaign_webhook_paused" };
  }

  if (await hasBypassEvent(idempotencyKey)) {
    await upsertPipelineStep(campaignId, leadEmail, "step_1");
    debugLog(
      "lib/instantly-bypass/handler.ts:idempotency",
      "E1 already sent for lead",
      { campaignId, leadEmail },
      "E",
    );
    if (!options?.skipReplyReprocess) {
      await triggerReplyReprocessAfterInterested(campaignId, leadEmail, "already_sent");
    }
    return { ok: true, skipped: "already_sent" };
  }

  try {
    await upsertPipelineStep(campaignId, leadEmail, "step_0");

    const template = await loadTemplate(campaignId, "interested_email1");

    if (isTemplateBodyEmpty(template.body_html)) {
      await recordBypassEvent({
        idempotencyKey,
        flow: "interested_email1",
        campaignId,
        leadEmail,
        webhookReceivedAt,
        status: "failed",
        errorMessage: "Empty interested_email1 template",
      });
      return { ok: false, error: "template_empty" };
    }

    const apiKey = getInstantlyApiKey();
    let lead = await findLeadByEmailInCampaign(apiKey, campaignId, leadEmail);

    const needsReservationLink = templateRequiresReservationLink(template.body_html);
    let reservationLink = readReservationLink(lead ?? undefined, payload);

    if (needsReservationLink && !reservationLink) {
      const provisioned = await ensureCampaignLeadLinks({
        campaignId,
        leadEmail,
      });

      if (provisioned.ok) {
        lead = await findLeadByEmailInCampaign(apiKey, campaignId, leadEmail);
        reservationLink = readReservationLink(lead ?? undefined, payload);
      }
    }

    if (needsReservationLink && !reservationLink) {
      await recordBypassEvent({
        idempotencyKey,
        flow: "interested_email1",
        campaignId,
        leadEmail,
        leadId: lead?.id,
        webhookReceivedAt,
        status: "failed",
        errorMessage: "Missing reservation link on lead",
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
      if (!options?.skipReplyReprocess) {
        await triggerReplyReprocessAfterInterested(
          campaignId,
          leadEmail,
          "e1_already_in_thread",
        );
      }
      return { ok: true, skipped: "e1_already_in_thread" };
    }

    const scheduledFor = e1WebhookScheduledFor(webhookReceivedAt);
    await insertBypassJob({
      idempotencyKey,
      campaignId,
      leadEmail,
      templateKey: "interested_email1",
      scheduledFor,
      payload: {
        lead_id: lead?.id ?? null,
        lead: lead ?? null,
        webhook_payload: payload,
        webhook_received_at: webhookReceivedAt.toISOString(),
        preferred_email_id:
          typeof payload.email_id === "string" ? payload.email_id : undefined,
        fallback_eaccount:
          typeof payload.email_account === "string"
            ? payload.email_account
            : undefined,
        template_subject: template.subject,
        template_body_html: template.body_html,
        bypass_send_window: true,
      },
    });

    debugLog(
      "lib/instantly-bypass/handler.ts:schedule",
      "E1 job queued — dispatching immediately",
      {
        campaignId,
        leadEmail,
        scheduledFor: scheduledFor.toISOString(),
        hasReservationLink: Boolean(reservationLink),
      },
      "A,C",
    );

    const dispatch = await dispatchBypassJobByIdempotencyKey(idempotencyKey);

    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b88b1a",
      },
      body: JSON.stringify({
        sessionId: "b88b1a",
        location: "lib/instantly-bypass/handler.ts:dispatch",
        message: "E1 webhook immediate dispatch result",
        data: {
          campaignId,
          leadEmail,
          outcome: dispatch.outcome,
          latencyMs: dispatch.latencyMs ?? null,
          skipped: dispatch.skipped ?? null,
          error: dispatch.error ?? null,
        },
        timestamp: Date.now(),
        runId: "post-fix",
        hypothesisId: "E1-instant",
      }),
    }).catch(() => {});
    // #endregion

    if (!options?.skipReplyReprocess) {
      await triggerReplyReprocessAfterInterested(campaignId, leadEmail, dispatch.outcome);
    }

    if (dispatch.outcome === "sent") {
      return {
        ok: true,
        latencyMs: dispatch.latencyMs,
        replyToUuid: dispatch.replyToUuid,
      };
    }
    if (dispatch.outcome === "skipped") {
      return { ok: true, skipped: dispatch.skipped ?? "skipped" };
    }
    if (dispatch.outcome === "rescheduled") {
      return { ok: true, skipped: "scheduled" };
    }
    if (dispatch.outcome === "not_found") {
      return { ok: false, error: "job_not_found" };
    }
    return { ok: false, error: dispatch.error ?? "dispatch_failed" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    debugLog(
      "lib/instantly-bypass/handler.ts:catch",
      "handleLeadInterested failed",
      { campaignId, leadEmail, error: message },
      "A",
    );
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
