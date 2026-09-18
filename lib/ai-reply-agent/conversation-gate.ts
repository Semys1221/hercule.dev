import { resolveCategoryForCampaign } from "@/lib/link-tracking/provision-campaign-lead";

import { leadHasUpcomingBooking } from "./booking-context";
import {
  inboundIsPureAcknowledgment,
  inboundShowsConfusion,
} from "./inbound-question";

export type ConversationGateResult = {
  skip: boolean;
  reason: string;
};

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
