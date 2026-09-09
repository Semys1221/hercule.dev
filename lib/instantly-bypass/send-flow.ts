import {
  findLeadByEmailInCampaign,
  getInstantlyApiKey,
  replyToEmail,
} from "./client";
import { flowIdempotencyKey, hasBypassEvent, recordBypassEvent } from "./jobs";
import { upsertPipelineStep, type PipelineStep } from "./pipeline";
import { resolveThreadForReply } from "./thread-resolver";
import { ensureCampaignLeadLinks } from "@/lib/link-tracking/provision-campaign-lead";
import { readReservationLink, templateRequiresReservationLink } from "./reservation-links";
import { resolveSlotVariables } from "./slot-variables";
import {
  buildTemplateVariables,
  isTemplateBodyEmpty,
  loadTemplate,
  renderTemplate,
} from "./templates";

import type {
  BypassFlow,
  InstantlyLeadRecord,
  InstantlyWebhookPayload,
} from "./types";

const STEP_AFTER_FLOW: Partial<Record<BypassFlow, PipelineStep>> = {
  interested_email1: "step_1",
  interested_email2: "step_2",
  interested_email3: "step_3",
};

const SENDABLE_FLOWS = new Set<BypassFlow>([
  "interested_email1",
  "interested_email2",
  "interested_email3",
]);

function readEmailAccount(lead?: InstantlyLeadRecord | null): string | undefined {
  if (!lead) return undefined;
  const payload = lead?.payload ?? {};
  const value = payload.email_account;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export type ExecuteBypassFlowParams = {
  flow: BypassFlow;
  campaignId: string;
  leadEmail: string;
  lead?: InstantlyLeadRecord | null;
  leadId?: string | null;
  idempotencyKey?: string;
  customBodyHtml?: string | null;
  webhookPayload?: InstantlyWebhookPayload | null;
  webhookReceivedAt?: Date | null;
  preferredEmailId?: string;
  fallbackEaccount?: string;
  skipPipelineAdvance?: boolean;
};

export type ExecuteBypassFlowResult =
  | {
      ok: true;
      skipped?: string;
      dispatchedAt?: Date;
      latencyMs?: number;
      replyToUuid?: string;
    }
  | { ok: false; error: string };

export async function executeBypassFlow(
  params: ExecuteBypassFlowParams,
): Promise<ExecuteBypassFlowResult> {
  const flow = params.flow;
  if (!SENDABLE_FLOWS.has(flow)) {
    return { ok: false, error: `unsupported_flow:${flow}` };
  }

  const campaignId = params.campaignId.trim();
  const leadEmail = params.leadEmail.trim().toLowerCase();
  const idempotencyKey =
    params.idempotencyKey ?? flowIdempotencyKey(flow, campaignId, leadEmail);

  if (await hasBypassEvent(idempotencyKey)) {
    const nextStep = STEP_AFTER_FLOW[flow];
    if (nextStep && !params.skipPipelineAdvance) {
      await upsertPipelineStep(campaignId, leadEmail, nextStep);
    }
    return { ok: true, skipped: "already_sent" };
  }

  const apiKey = getInstantlyApiKey();
  let lead =
    params.lead ??
    (await findLeadByEmailInCampaign(apiKey, campaignId, leadEmail));

  const template = await loadTemplate(campaignId, flow);
  const customBodyHtml =
    typeof params.customBodyHtml === "string" && params.customBodyHtml.trim()
      ? params.customBodyHtml
      : null;

  if (isTemplateBodyEmpty(template.body_html)) {
    await recordBypassEvent({
      idempotencyKey,
      flow,
      campaignId,
      leadEmail,
      leadId: params.leadId ?? lead?.id,
      webhookReceivedAt: params.webhookReceivedAt ?? null,
      status: "failed",
      errorMessage: `Empty template ${flow}`,
    });
    return { ok: false, error: "template_empty" };
  }

  const bodyHtml = customBodyHtml ?? template.body_html;
  const needsReservationLink = templateRequiresReservationLink(bodyHtml);
  let reservationLink = readReservationLink(
    lead ?? undefined,
    params.webhookPayload ?? undefined,
  );

  if (needsReservationLink && !reservationLink) {
    const provisioned = await ensureCampaignLeadLinks({
      campaignId,
      leadEmail,
    });
    if (provisioned.ok) {
      lead = await findLeadByEmailInCampaign(apiKey, campaignId, leadEmail);
      reservationLink = readReservationLink(
        lead ?? undefined,
        params.webhookPayload ?? undefined,
      );
    }
  }

  if (needsReservationLink && !reservationLink) {
    await recordBypassEvent({
      idempotencyKey,
      flow,
      campaignId,
      leadEmail,
      leadId: params.leadId ?? lead?.id,
      webhookReceivedAt: params.webhookReceivedAt ?? null,
      status: "failed",
      errorMessage: "Missing reservation link on lead",
    });
    return { ok: false, error: "missing_reservation_link" };
  }

  const thread = await resolveThreadForReply(apiKey, {
    leadEmail,
    campaignId,
    fallbackEaccount:
      params.fallbackEaccount ?? readEmailAccount(lead ?? undefined),
    preferredEmailId: params.preferredEmailId,
  });

  if (!thread) {
    await recordBypassEvent({
      idempotencyKey,
      flow,
      campaignId,
      leadEmail,
      leadId: params.leadId ?? lead?.id,
      webhookReceivedAt: params.webhookReceivedAt ?? null,
      status: "failed",
      errorMessage: "Could not resolve Unibox thread",
    });
    return { ok: false, error: "thread_not_found" };
  }

  const slotVars = await resolveSlotVariables(campaignId, bodyHtml);
  const vars = {
    ...buildTemplateVariables(params.webhookPayload ?? {}, lead ?? undefined),
    ...slotVars,
  };
  const rendered = renderTemplate({ ...template, body_html: bodyHtml }, vars);
  const html = rendered.html;
  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "f685d6",
    },
    body: JSON.stringify({
      sessionId: "f685d6",
      hypothesisId: "H3",
      location: "send-flow.ts:executeBypassFlow",
      message: "rendered bypass email",
      data: {
        flow,
        campaignId,
        slot_1: slotVars.slot_1,
        slot_2: slotVars.slot_2,
        hasSlotPlaceholders:
          html.includes("{{slot_1}}") || html.includes("{{slot_2}}"),
        hasWrongBillingLink: html.includes("hercule.dev/cvg/comptable"),
      },
      timestamp: Date.now(),
      runId: "pre-fix",
    }),
  }).catch(() => {});
  // #endregion
  const subject = thread.subject?.trim() || rendered.subject || "your message";
  const started = params.webhookReceivedAt ?? new Date();

  await replyToEmail(apiKey, {
    eaccount: thread.eaccount,
    replyToUuid: thread.replyToUuid,
    subject,
    html,
  });

  const dispatchedAt = new Date();
  const latencyMs = dispatchedAt.getTime() - started.getTime();

  const nextStep = STEP_AFTER_FLOW[flow];
  if (nextStep && !params.skipPipelineAdvance) {
    await upsertPipelineStep(campaignId, leadEmail, nextStep);
  }

  await recordBypassEvent({
    idempotencyKey,
    flow,
    campaignId,
    leadEmail,
    leadId: params.leadId ?? lead?.id,
    webhookReceivedAt: params.webhookReceivedAt ?? null,
    dispatchedAt,
    latencyMs,
    status: "sent",
    replyToUuid: thread.replyToUuid,
  });

  return {
    ok: true,
    dispatchedAt,
    latencyMs,
    replyToUuid: thread.replyToUuid,
  };
}

export { STEP_AFTER_FLOW, SENDABLE_FLOWS };
