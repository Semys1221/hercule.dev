import { BOOKING_CONFIRMATION_DISABLED } from "@/lib/legacy/booking-communication/confirmation-disabled";
import { startConferenceInviteSequence } from "@/lib/legacy/cif-conference-sequence/orchestrator";
import { startCloseIndecisSequence } from "@/lib/legacy/close-indecis-sequence/orchestrator";
import { handleLeadInterested } from "@/lib/legacy/instantly-bypass/handler";
import { executeBypassFlow } from "@/lib/legacy/instantly-bypass/send-flow";
import { getOutreachConfigView } from "@/lib/legacy/admin/niches/outreach-config";
import type { Niche } from "@/lib/legacy/admin/navigation";
import {
  createLinkTrackingClient,
  findLeadByEmail,
  normalizeEmail,
} from "@/lib/legacy/link-tracking/supabase";
import type { LinkTrackingLead } from "@/lib/legacy/link-tracking/types";
import { startOnboardingSequence } from "@/lib/legacy/onboarding-sequence/orchestrator";
import { startNoShowSequence } from "@/lib/legacy/no-show-sequence/orchestrator";
import { startBookingSequence } from "@/lib/legacy/booking-communication/orchestrator";
import { createSalesCallsClient } from "@/lib/legacy/sales-calls/supabase";
import type { SalesCall } from "@/lib/legacy/sales-calls/types";
import { startUpsellSequence } from "@/lib/legacy/upsell-sequence/orchestrator";

import { isMeetingSequenceSlug } from "./phase-map";

export type DispatchSequenceResult =
  | { ok: true; currentStep?: string }
  | { ok: false; error: string };

async function findLeadInNiche(
  email: string,
  niche: Niche,
): Promise<LinkTrackingLead | null> {
  const client = createLinkTrackingClient();
  const lookup = await findLeadByEmail(client, email);
  if (!lookup || lookup.category !== niche) {
    const { data } = await client.from(niche).select("*").eq("email", normalizeEmail(email)).maybeSingle();
    return (data as LinkTrackingLead | null) ?? null;
  }
  return lookup.lead;
}

async function findLatestSalesCall(
  lead: LinkTrackingLead,
  niche: Niche,
): Promise<SalesCall | null> {
  const client = createSalesCallsClient();
  const column =
    niche === "agence"
      ? "agence_id"
      : niche === "comptable"
        ? "comptable_id"
        : niche === "cif"
          ? "cif_id"
          : "entreprise_id";

  const { data, error } = await client
    .from("sales_calls")
    .select("*")
    .eq(column, lead.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`sales_calls lookup failed: ${error.message}`);
  }
  return (data as SalesCall | null) ?? null;
}

export async function dispatchSequenceStart(params: {
  sequenceSlug: string;
  niche: Niche;
  leadEmail: string;
  campaignId?: string;
  scheduledAt?: Date;
}): Promise<DispatchSequenceResult> {
  const email = normalizeEmail(params.leadEmail);
  const lead = await findLeadInNiche(email, params.niche);
  if (!lead) {
    return { ok: false, error: "lead_not_found" };
  }

  if (isMeetingSequenceSlug(params.sequenceSlug)) {
    if (BOOKING_CONFIRMATION_DISABLED) {
      return { ok: false, error: "booking_confirmation_disabled" };
    }
    const result = await startBookingSequence({
      lead,
      category: params.niche,
      triggeredBy: "manual",
      sequenceStartsAt: params.scheduledAt ?? new Date(),
    });
    if (!result.started) {
      return { ok: false, error: result.reason ?? "sequence_not_started" };
    }
    return { ok: true, currentStep: "immediate" };
  }

  switch (params.sequenceSlug) {
    case "subsequence-interested": {
      const config = await getOutreachConfigView(params.niche);
      const campaignId = params.campaignId ?? config.instantly_campaign_id;
      if (!campaignId) {
        return { ok: false, error: "missing_campaign_id" };
      }
      const result = await handleLeadInterested({
        campaign_id: campaignId,
        lead_email: email,
        event_type: "lead_interested",
        timestamp: (params.scheduledAt ?? new Date()).toISOString(),
      });
      if (!result.ok) {
        return { ok: false, error: result.error ?? "interested_failed" };
      }
      return { ok: true, currentStep: "interested_email1" };
    }
    case "no-show": {
      const config = await getOutreachConfigView(params.niche);
      const campaignId = params.campaignId ?? config.instantly_campaign_id;
      if (!campaignId) {
        return { ok: false, error: "missing_campaign_id" };
      }
      const result = await executeBypassFlow({
        flow: "no_show_email1",
        campaignId,
        leadEmail: email,
        leadId: lead.id,
      });
      if (!result.ok) {
        return { ok: false, error: result.error ?? "no_show_failed" };
      }
      return { ok: true, currentStep: "no_show_email1" };
    }
    case "reply-agent":
      return { ok: true, currentStep: "waiting_for_replies" };
    case "cif-conference-invite": {
      const result = await startConferenceInviteSequence({ leadId: lead.id });
      if (!result.started) {
        return { ok: false, error: result.reason ?? "conference_not_started" };
      }
      return { ok: true, currentStep: "conference_invite" };
    }
    case "onboarding-sequence": {
      const result = await startOnboardingSequence(params.niche, lead.id);
      if (!result.started) {
        return { ok: false, error: result.reason ?? "onboarding_not_started" };
      }
      return { ok: true, currentStep: "onboarding_j0" };
    }
    case "close-indecis": {
      const salesCall = await findLatestSalesCall(lead, params.niche);
      if (!salesCall) {
        return { ok: false, error: "sales_call_not_found" };
      }
      const result = await startCloseIndecisSequence(salesCall, lead.id, params.niche);
      if (!result.started) {
        return { ok: false, error: result.reason ?? "close_indecis_not_started" };
      }
      return { ok: true, currentStep: "close_indecis_1" };
    }
    case "sales-call-no-show": {
      const salesCall = await findLatestSalesCall(lead, params.niche);
      if (!salesCall) {
        return { ok: false, error: "sales_call_not_found" };
      }
      const result = await startNoShowSequence(salesCall, lead.id, params.niche);
      if (!result.started) {
        return { ok: false, error: result.reason ?? "no_show_indecis_not_started" };
      }
      return { ok: true, currentStep: "no_show_indecis_1" };
    }
    case "upsell": {
      const salesCall = await findLatestSalesCall(lead, params.niche);
      if (!salesCall) {
        return { ok: false, error: "sales_call_not_found" };
      }
      const result = await startUpsellSequence(salesCall);
      if (!result.started) {
        return { ok: false, error: result.reason ?? "upsell_not_started" };
      }
      return { ok: true, currentStep: "upsell_email_1" };
    }
    case "comptable-acquisition-post-payment":
    case "free-trial":
    case "free-trial-started":
    case "proposition-ludovic-post-payment":
      return { ok: false, error: "sequence_retired_use_conference_checkout" };
    default:
      return { ok: false, error: `unsupported_sequence:${params.sequenceSlug}` };
  }
}
