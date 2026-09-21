import type { LeadCategory } from "@/lib/link-tracking/types";
import type { Niche } from "@/lib/admin/navigation";
import { meetingSequenceSlugForNiche } from "@/lib/admin/email-sequences/registry";
import type { BypassFlow } from "@/lib/instantly-bypass/types";

import {
  advanceRecipientStep,
  completeRecipient,
  enrollRecipient,
  stopRecipient,
  transitionPhase,
  syncRecipientFireAndForget,
} from "./live-sync";
import { nicheForCampaignId } from "./niche-for-campaign";
import { slugFromBookingEmailTypes } from "./sync";
import { defaultBookingSlugForNiche } from "./transitions";

const FLOW_TO_STEP: Partial<Record<BypassFlow, string>> = {
  interested_email1: "interested_email1",
  interested_email2: "interested_email2",
  interested_email3: "interested_email3",
  no_show_email1: "no_show_email1",
  no_show_email2: "no_show_email2",
};

export function syncInterestedEnrolled(params: {
  campaignId: string;
  leadEmail: string;
  niche?: Niche | null;
  currentStep?: string;
}): void {
  syncRecipientFireAndForget(async () => {
    const niche = params.niche ?? (await nicheForCampaignId(params.campaignId));
    if (!niche) return;
    await enrollRecipient({
      leadEmail: params.leadEmail,
      niche,
      sequenceSlug: "subsequence-interested",
      campaignId: params.campaignId,
      status: "active",
      currentStep: params.currentStep ?? "interested_email1",
      metadata: { source: "instantly_interested" },
    });
  }, "interested_enrolled");
}

export function syncBypassFlowAdvanced(params: {
  campaignId: string;
  leadEmail: string;
  flow: BypassFlow;
  niche?: Niche | null;
}): void {
  syncRecipientFireAndForget(async () => {
    const niche = params.niche ?? (await nicheForCampaignId(params.campaignId));
    if (!niche) return;
    const step = FLOW_TO_STEP[params.flow];
    if (!step) return;
    const slug =
      params.flow.startsWith("no_show") ? "no-show" : "subsequence-interested";
    await advanceRecipientStep({
      leadEmail: params.leadEmail,
      niche,
      sequenceSlug: slug,
      currentStep: step,
    });
  }, "bypass_flow_advanced");
}

export function syncPipelineClosed(params: {
  campaignId: string;
  leadEmail: string;
  niche?: Niche | null;
}): void {
  syncRecipientFireAndForget(async () => {
    const niche = params.niche ?? (await nicheForCampaignId(params.campaignId));
    if (!niche) return;
    await completeRecipient({
      leadEmail: params.leadEmail,
      niche,
      sequenceSlug: "subsequence-interested",
      reason: "pipeline_closed",
    });
  }, "pipeline_closed");
}

export function syncReplyAgentPipeline(params: {
  campaignId: string;
  leadEmail: string;
  niche?: Niche | null;
  currentStep?: string;
}): void {
  syncRecipientFireAndForget(async () => {
    const niche = params.niche ?? (await nicheForCampaignId(params.campaignId));
    if (!niche) return;
    await enrollRecipient({
      leadEmail: params.leadEmail,
      niche,
      sequenceSlug: "reply-agent",
      campaignId: params.campaignId,
      status: "active",
      currentStep: params.currentStep ?? "replies_to_handle",
      metadata: { source: "reply_agent_pipeline" },
    });
  }, "reply_agent_pipeline");
}

export function syncCalendlyBooked(params: {
  niche: LeadCategory;
  leadEmail: string;
  leadId: string;
}): void {
  syncRecipientFireAndForget(async () => {
    const niche = params.niche as Niche;
    await completeRecipient({
      leadEmail: params.leadEmail,
      niche,
      sequenceSlug: "subsequence-interested",
      reason: "meeting_booked",
    });
    if (niche === "cif") {
      await stopRecipient({
        leadEmail: params.leadEmail,
        niche,
        sequenceSlug: "cif-conference-invite",
        reason: "meeting_booked",
      });
    }
    await enrollRecipient({
      leadEmail: params.leadEmail,
      niche,
      sequenceSlug: defaultBookingSlugForNiche(niche),
      leadId: params.leadId,
      status: "active",
      currentStep: "meeting_booked",
      metadata: { source: "calendly_booked" },
    });
  }, "calendly_booked");
}

export function syncBookingSequenceStarted(params: {
  niche: LeadCategory;
  leadEmail: string;
  leadId: string;
  sequenceSlug: string;
}): void {
  syncRecipientFireAndForget(async () => {
    await enrollRecipient({
      leadEmail: params.leadEmail,
      niche: params.niche as Niche,
      sequenceSlug: params.sequenceSlug,
      leadId: params.leadId,
      status: "active",
      currentStep: "immediate",
      metadata: { source: "booking_sequence_started" },
    });
  }, "booking_sequence_started");
}

export function syncBookingJobSent(params: {
  leadEmail: string;
  niche: LeadCategory;
  emailType: string;
  leadId: string;
}): void {
  syncRecipientFireAndForget(async () => {
    const slug = slugFromBookingEmailTypes([params.emailType]);
    if (!slug) return;
    await advanceRecipientStep({
      leadEmail: params.leadEmail,
      niche: params.niche as Niche,
      sequenceSlug: slug,
      currentStep: params.emailType,
    });
  }, "booking_job_sent");
}

export function syncOnboardingStarted(params: {
  niche: LeadCategory;
  leadEmail: string;
  leadId: string;
}): void {
  syncRecipientFireAndForget(async () => {
    const niche = params.niche as Niche;
    const fromSlug = meetingSequenceSlugForNiche(niche);
    try {
      await transitionPhase({
        leadEmail: params.leadEmail,
        niche,
        fromSlug,
        toSlug: "onboarding-sequence",
        currentStep: "onboarding_j0",
        metadata: { source: "retraction_activated" },
      });
    } catch {
      await enrollRecipient({
        leadEmail: params.leadEmail,
        niche,
        sequenceSlug: "onboarding-sequence",
        leadId: params.leadId,
        status: "active",
        currentStep: "onboarding_j0",
        metadata: { source: "retraction_activated_fallback" },
      });
    }
  }, "onboarding_started");
}

export function syncClientSequenceStarted(params: {
  niche: LeadCategory;
  leadEmail: string;
  leadId: string;
  sequenceSlug: string;
  currentStep?: string;
}): void {
  syncRecipientFireAndForget(async () => {
    await enrollRecipient({
      leadEmail: params.leadEmail,
      niche: params.niche as Niche,
      sequenceSlug: params.sequenceSlug,
      leadId: params.leadId,
      status: "active",
      currentStep: params.currentStep,
      metadata: { source: "client_sequence_started" },
    });
  }, "client_sequence_started");
}

export function syncStopAllForEmail(leadEmail: string, reason: string): void {
  syncRecipientFireAndForget(async () => {
    const { ALL_NICHES } = await import("@/lib/admin/navigation");
    for (const niche of ALL_NICHES) {
      await stopRecipient({ leadEmail, niche, reason });
    }
  }, "stop_all");
}

export function syncStripePaymentStops(params: {
  niche: LeadCategory;
  leadEmail: string;
}): void {
  syncRecipientFireAndForget(async () => {
    const niche = params.niche as Niche;
    await stopRecipient({
      leadEmail: params.leadEmail,
      niche,
      sequenceSlug: "close-indecis",
      reason: "payment_received",
    });
    await stopRecipient({
      leadEmail: params.leadEmail,
      niche,
      sequenceSlug: "sales-call-no-show",
      reason: "payment_received",
    });
    if (niche === "comptable") {
      await stopRecipient({
        leadEmail: params.leadEmail,
        niche,
        sequenceSlug: "free-trial",
        reason: "payment_received",
      });
    }
  }, "stripe_payment_stops");
}

export function syncLeadConfirmed(params: {
  niche: LeadCategory;
  leadEmail: string;
}): void {
  syncRecipientFireAndForget(async () => {
    const niche = params.niche as Niche;
    await completeRecipient({
      leadEmail: params.leadEmail,
      niche,
      sequenceSlug: meetingSequenceSlugForNiche(niche),
      reason: "lead_confirmed",
    });
  }, "lead_confirmed");
}

export function syncCalendlyCancelled(params: {
  niche: LeadCategory;
  leadEmail: string;
}): void {
  syncRecipientFireAndForget(async () => {
    const niche = params.niche as Niche;
    await stopRecipient({
      leadEmail: params.leadEmail,
      niche,
      sequenceSlug: meetingSequenceSlugForNiche(niche),
      reason: "calendly_cancelled",
    });
  }, "calendly_cancelled");
}
