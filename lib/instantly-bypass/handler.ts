import { findLeadByEmailInCampaign, getInstantlyApiKey } from "./client";
import { e1WebhookScheduledFor } from "./constants";
import { threadAlreadyHasE1 } from "./e1-thread-guard";
import {
  hasBypassEvent,
  interestedIdempotencyKey,
  recordBypassEvent,
} from "./jobs";
import { upsertPipelineStep } from "./pipeline";
import {
  hasPendingBypassJob,
  insertBypassJob,
} from "./scheduled-jobs";
import { ensureCampaignLeadLinks } from "@/lib/link-tracking/provision-campaign-lead";
import { readReservationLink, templateRequiresReservationLink } from "./reservation-links";
import { isTemplateBodyEmpty, loadBypassConfig, loadTemplate } from "./templates";

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
      "X-Debug-Session-Id": "ce280c",
    },
    body: JSON.stringify({
      sessionId: "ce280c",
      location,
      message,
      data,
      hypothesisId,
      timestamp: Date.now(),
      runId: "e1-missing-link",
    }),
  }).catch(() => {});
  // #endregion
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

    debugLog("handler.ts:reservation-check", "E1 reservation link pre-check", {
      campaignId,
      leadEmail,
      needsReservationLink,
      hasReservationLink: Boolean(reservationLink),
      leadId: lead?.id ?? null,
    }, "H1");

    if (needsReservationLink && !reservationLink) {
      const provisioned = await ensureCampaignLeadLinks({
        campaignId,
        leadEmail,
      });

      debugLog(
        "handler.ts:auto-provision",
        "Attempted auto-provision for missing reservation link",
        {
          campaignId,
          leadEmail,
          provisionOk: provisioned.ok,
          provisionReason: provisioned.ok ? null : provisioned.reason,
          created: provisioned.ok ? provisioned.created : null,
        },
        "H2",
      );

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
      debugLog(
        "handler.ts:missing-link-fail",
        "E1 blocked after provision attempt",
        { campaignId, leadEmail, leadId: lead?.id ?? null },
        "H1",
      );
      return { ok: false, error: "missing_reservation_link" };
    }

    if (await hasPendingBypassJob(idempotencyKey)) {
      return { ok: true, skipped: "already_scheduled" };
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
        bypass_send_window: true,
      },
    });

    return { ok: true, skipped: "scheduled" };
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
