import { resolveCategoryForCampaign } from "@/lib/link-tracking/provision-campaign-lead";

import { leadHasUpcomingBooking } from "./booking-context";
import {
  inboundIsPureAcknowledgment,
  inboundIsPureInterestSignal,
  inboundShowsConfusion,
} from "./inbound-question";
import { createAiReplyAgentClient } from "./supabase";

export type ConversationGateResult = {
  skip: boolean;
  reason: string;
};

const CTA_MARKERS = ["hercule.dev/reservation", "reservation-conference"];

async function priorOutboundHadCta(params: {
  campaignId: string;
  leadEmail: string;
}): Promise<boolean> {
  const client = createAiReplyAgentClient();
  const { data } = await client
    .from("ai_reply_agent_messages")
    .select("body_text")
    .eq("campaign_id", params.campaignId)
    .eq("lead_email", params.leadEmail.trim().toLowerCase())
    .eq("direction", "outbound")
    .order("created_at", { ascending: false })
    .limit(5);

  return (data ?? []).some((row) => {
    const body = String(row.body_text ?? "").toLowerCase();
    return CTA_MARKERS.some((marker) => body.includes(marker));
  });
}

export async function evaluateConversationGate(params: {
  campaignId: string;
  leadEmail: string;
  replyFromEmail?: string | null;
  inboundText: string;
}): Promise<ConversationGateResult> {
  const inboundText = params.inboundText.trim();
  if (!inboundText || inboundText === "(empty body)") {
    return { skip: false, reason: "" };
  }

  if (inboundShowsConfusion(inboundText)) {
    return { skip: false, reason: "" };
  }

  const hadCta = await priorOutboundHadCta({
    campaignId: params.campaignId,
    leadEmail: params.leadEmail,
  }).catch(() => false);

  if (
    hadCta &&
    (inboundIsPureInterestSignal(inboundText) || inboundIsPureAcknowledgment(inboundText))
  ) {
    return {
      skip: true,
      reason:
        "Confirmation positive sans nouvelle question après envoi du CTA — pas de relance",
    };
  }

  if (!inboundIsPureAcknowledgment(inboundText)) {
    return { skip: false, reason: "" };
  }

  try {
    const category = await resolveCategoryForCampaign(params.campaignId);
    if (category !== "comptable" && category !== "cif") {
      return { skip: false, reason: "" };
    }

    const hasBooking = await leadHasUpcomingBooking(
      category,
      params.leadEmail,
      params.replyFromEmail,
    );
    if (!hasBooking) {
      return { skip: false, reason: "" };
    }

    return {
      skip: true,
      reason:
        "Accusé de réception après réservation Calendly — aucune nouvelle question",
    };
  } catch {
    return { skip: false, reason: "" };
  }
}
