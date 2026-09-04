import {
  findLeadByEmailInCampaign,
  getInstantlyApiKey,
  updateLeadInterestStatusBypass,
} from "./client";
import {
  flowIdempotencyKey,
  getBypassEventSentAt,
  hasBypassEvent,
  pipelineCloseIdempotencyKey,
  recordBypassEvent,
} from "./jobs";
import {
  listPipelineLeadsByStep,
  upsertPipelineStep,
  type PipelineStep,
} from "./pipeline";
import { getWebhookAutoSendEnabled } from "./settings";
import {
  hasPendingBypassJob,
  insertBypassJob,
} from "./scheduled-jobs";
import { executeBypassFlow } from "./send-flow";
import { isWithinSendWindow, nextSendSlot } from "./send-window";
import { leadHasRepliedSince } from "./thread-resolver";
import { listBypassConfigs } from "./templates";

import type { BypassFlow } from "./types";

const NOT_INTERESTED_STATUS = -1;

type SendRule = {
  step: PipelineStep;
  prevFlow: BypassFlow;
  nextFlow: BypassFlow;
  delayHours: number;
  action: "send";
};

type CloseRule = {
  step: PipelineStep;
  prevFlow: BypassFlow;
  delayHours: number;
  action: "close";
};

type AdvanceRule = SendRule | CloseRule;

const RULES: AdvanceRule[] = [
  {
    step: "step_1",
    prevFlow: "interested_email1",
    nextFlow: "interested_email2",
    delayHours: 24,
    action: "send",
  },
  {
    step: "step_2",
    prevFlow: "interested_email2",
    nextFlow: "interested_email3",
    delayHours: 48,
    action: "send",
  },
  {
    step: "step_3",
    prevFlow: "interested_email3",
    delayHours: 48,
    action: "close",
  },
];

export type PipelineAdvanceStats = {
  processed: number;
  sent: number;
  closed: number;
  replied: number;
  queued: number;
  skipped: number;
  failed: number;
  globalPaused?: boolean;
};

function isDue(sentAtIso: string, delayHours: number): boolean {
  const sentAt = new Date(sentAtIso);
  const dueAt = sentAt.getTime() + delayHours * 60 * 60 * 1000;
  return Date.now() >= dueAt;
}

async function listActiveAdvanceCampaigns() {
  const configs = await listBypassConfigs();
  return configs.filter(
    (config) =>
      Boolean(config.initialized_at) &&
      config.pipeline_auto_advance_enabled !== false,
  );
}

async function moveToRepliesToHandle(
  campaignId: string,
  leadEmail: string,
): Promise<void> {
  await upsertPipelineStep(campaignId, leadEmail, "replies_to_handle");
}

async function closePipelineLead(params: {
  campaignId: string;
  leadEmail: string;
  leadId?: string | null;
}): Promise<"closed" | "skipped"> {
  const { campaignId, leadEmail } = params;
  const idempotencyKey = pipelineCloseIdempotencyKey(campaignId, leadEmail);

  if (await hasBypassEvent(idempotencyKey)) {
    await upsertPipelineStep(campaignId, leadEmail, "step_4");
    return "skipped";
  }

  const apiKey = getInstantlyApiKey();
  await updateLeadInterestStatusBypass(apiKey, {
    lead_email: leadEmail,
    interest_value: NOT_INTERESTED_STATUS,
    campaign_id: campaignId,
  });

  const dispatchedAt = new Date();
  await upsertPipelineStep(campaignId, leadEmail, "step_4");
  await recordBypassEvent({
    idempotencyKey,
    flow: "pipeline_close",
    campaignId,
    leadEmail,
    leadId: params.leadId ?? null,
    dispatchedAt,
    latencyMs: 0,
    status: "sent",
  });

  return "closed";
}

async function sendNextFlow(params: {
  campaignId: string;
  leadEmail: string;
  flow: BypassFlow;
  leadId?: string | null;
}): Promise<"sent" | "queued" | "skipped" | "failed"> {
  const { campaignId, leadEmail, flow } = params;
  const idempotencyKey = flowIdempotencyKey(flow, campaignId, leadEmail);

  if (await hasBypassEvent(idempotencyKey)) {
    return "skipped";
  }

  if (await hasPendingBypassJob(idempotencyKey)) {
    return "skipped";
  }

  if (!isWithinSendWindow()) {
    const apiKey = getInstantlyApiKey();
    const lead =
      (await findLeadByEmailInCampaign(apiKey, campaignId, leadEmail)) ?? undefined;
    await insertBypassJob({
      idempotencyKey,
      campaignId,
      leadEmail,
      templateKey: flow,
      scheduledFor: nextSendSlot(),
      payload: {
        lead_id: params.leadId ?? lead?.id ?? null,
        lead: lead ?? null,
      },
    });
    return "queued";
  }

  const apiKey = getInstantlyApiKey();
  const lead = await findLeadByEmailInCampaign(apiKey, campaignId, leadEmail);
  const result = await executeBypassFlow({
    flow,
    campaignId,
    leadEmail,
    lead,
    leadId: params.leadId ?? lead?.id,
    idempotencyKey,
  });

  if (!result.ok) {
    return "failed";
  }
  if (result.skipped) {
    return "skipped";
  }
  return "sent";
}

async function processLead(params: {
  campaignId: string;
  leadEmail: string;
  rule: AdvanceRule;
}): Promise<"sent" | "closed" | "replied" | "queued" | "skipped" | "failed"> {
  const { campaignId, leadEmail, rule } = params;
  const sentAt = await getBypassEventSentAt(
    flowIdempotencyKey(rule.prevFlow, campaignId, leadEmail),
  );

  if (!sentAt || !isDue(sentAt, rule.delayHours)) {
    return "skipped";
  }

  const apiKey = getInstantlyApiKey();
  if (await leadHasRepliedSince(apiKey, leadEmail, sentAt)) {
    await moveToRepliesToHandle(campaignId, leadEmail);
    return "replied";
  }

  if (rule.action === "close") {
    const lead = await findLeadByEmailInCampaign(apiKey, campaignId, leadEmail);
    const outcome = await closePipelineLead({
      campaignId,
      leadEmail,
      leadId: lead?.id,
    });
    return outcome === "closed" ? "closed" : "skipped";
  }

  const lead = await findLeadByEmailInCampaign(apiKey, campaignId, leadEmail);
  return sendNextFlow({
    campaignId,
    leadEmail,
    flow: rule.nextFlow,
    leadId: lead?.id,
  });
}

export async function advanceDuePipelineLeads(
  limit = 50,
): Promise<PipelineAdvanceStats> {
  if (!(await getWebhookAutoSendEnabled())) {
    return {
      processed: 0,
      sent: 0,
      closed: 0,
      replied: 0,
      queued: 0,
      skipped: 0,
      failed: 0,
      globalPaused: true,
    };
  }

  const campaigns = await listActiveAdvanceCampaigns();
  const stats: PipelineAdvanceStats = {
    processed: 0,
    sent: 0,
    closed: 0,
    replied: 0,
    queued: 0,
    skipped: 0,
    failed: 0,
  };

  let remaining = limit;

  for (const rule of RULES) {
    if (remaining <= 0) break;

    for (const campaign of campaigns) {
      if (remaining <= 0) break;

      const rows = await listPipelineLeadsByStep(
        campaign.campaign_id,
        rule.step,
        remaining,
      );

      for (const row of rows) {
        if (remaining <= 0) break;
        remaining -= 1;
        stats.processed += 1;

        try {
          const outcome = await processLead({
            campaignId: row.campaign_id,
            leadEmail: row.lead_email,
            rule,
          });

          switch (outcome) {
            case "sent":
              stats.sent += 1;
              break;
            case "closed":
              stats.closed += 1;
              break;
            case "replied":
              stats.replied += 1;
              break;
            case "queued":
              stats.queued += 1;
              break;
            case "failed":
              stats.failed += 1;
              break;
            default:
              stats.skipped += 1;
          }
        } catch {
          stats.failed += 1;
        }
      }
    }
  }

  return stats;
}

export { RULES, isDue };
