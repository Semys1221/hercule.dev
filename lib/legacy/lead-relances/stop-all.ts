import { cancelPendingAiReplyJobsForLead } from "@/lib/legacy/ai-reply-agent/messages";
import {
  cancelAllPendingJobsForLead,
  cancelConferenceInviteJobs,
} from "@/lib/legacy/booking-communication/jobs";
import {
  getInstantlyApiKey,
  updateLeadInterestStatusBypass,
} from "@/lib/legacy/instantly-bypass/client";
import { cancelPendingBypassJobsForLead } from "@/lib/legacy/instantly-bypass/scheduled-jobs";
import { upsertPipelineStep } from "@/lib/legacy/instantly-bypass/pipeline";
import {
  createLinkTrackingClient,
  findLeadByEmail,
  markLeadCancelled,
} from "@/lib/legacy/link-tracking/supabase";

import { addReplyAgentBlocklistEntry } from "./blocklist";

const NOT_INTERESTED_STATUS = -1;

export type StopLeadRelancesResult = {
  leadEmail: string;
  campaignId?: string;
  dryRun: boolean;
  bookingJobsCancelled: number;
  conferenceJobsCancelled: number;
  bypassJobsCancelled: number;
  replyAgentJobsCancelled: number;
  blocklisted: boolean;
  pipelineClosed: boolean;
  instantlyTagged: boolean;
  crmLeadUpdated: boolean;
};

export async function stopAllLeadRelances(params: {
  leadEmail: string;
  campaignId?: string;
  reason: string;
  dryRun?: boolean;
}): Promise<StopLeadRelancesResult> {
  const leadEmail = params.leadEmail.trim().toLowerCase();
  const campaignId = params.campaignId?.trim();
  const dryRun = params.dryRun ?? false;

  const result: StopLeadRelancesResult = {
    leadEmail,
    campaignId,
    dryRun,
    bookingJobsCancelled: 0,
    conferenceJobsCancelled: 0,
    bypassJobsCancelled: 0,
    replyAgentJobsCancelled: 0,
    blocklisted: false,
    pipelineClosed: false,
    instantlyTagged: false,
    crmLeadUpdated: false,
  };

  const linkClient = createLinkTrackingClient();
  const lookup = await findLeadByEmail(linkClient, leadEmail);

  if (lookup && !dryRun) {
    await markLeadCancelled(linkClient, lookup);
    result.crmLeadUpdated = true;
    result.bookingJobsCancelled = await cancelAllPendingJobsForLead(lookup.lead.id);
    if (lookup.category === "cif") {
      result.conferenceJobsCancelled = await cancelConferenceInviteJobs(lookup.lead.id);
    }
  } else if (lookup && dryRun) {
    result.crmLeadUpdated = true;
  }

  if (campaignId) {
    if (!dryRun) {
      result.bypassJobsCancelled = await cancelPendingBypassJobsForLead(
        leadEmail,
        campaignId,
      );
      result.replyAgentJobsCancelled = await cancelPendingAiReplyJobsForLead(
        campaignId,
        leadEmail,
      );
      await upsertPipelineStep(campaignId, leadEmail, "step_4");
      await addReplyAgentBlocklistEntry({
        campaignId,
        leadEmail,
        reason: params.reason,
      });
      const apiKey = getInstantlyApiKey();
      await updateLeadInterestStatusBypass(apiKey, {
        lead_email: leadEmail,
        interest_value: NOT_INTERESTED_STATUS,
        campaign_id: campaignId,
      });
    }
    result.pipelineClosed = true;
    result.blocklisted = true;
    result.instantlyTagged = true;
  }

  if (!dryRun) {
    const { syncStopAllForEmail } = await import("@/lib/legacy/admin/management/recipients/hooks");
    syncStopAllForEmail(leadEmail, params.reason);
  }

  return result;
}
