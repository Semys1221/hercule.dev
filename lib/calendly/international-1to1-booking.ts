import { createSingleUseSchedulingLink } from "@/lib/calendly/create-single-use-link";
import { getInternational1to1EventTypeUri } from "@/lib/calendly/availability";
import {
  canIssueInternational1to1Link,
  inboundLooksLikeInternationalLead,
} from "@/lib/ai-reply-agent/international-inbound";

export type ResolveInternational1to1BookingContextParams = {
  inboundText: string;
  leadEmail: string;
  threadContext?: string | null;
};

export type ResolveInternational1to1BookingContextResult =
  | { status: "skipped"; reason: string }
  | { status: "ready"; bookingUrl: string };

export async function resolveInternational1to1BookingContext(
  params: ResolveInternational1to1BookingContextParams,
): Promise<ResolveInternational1to1BookingContextResult> {
  if (!inboundLooksLikeInternationalLead(params.inboundText, params.leadEmail)) {
    return { status: "skipped", reason: "not_international_lead" };
  }
  if (!canIssueInternational1to1Link(params)) {
    return { status: "skipped", reason: "pricing_not_accepted" };
  }

  const eventTypeUri = await getInternational1to1EventTypeUri();
  const link = await createSingleUseSchedulingLink({ eventTypeUri });
  return { status: "ready", bookingUrl: link.bookingUrl };
}

export function formatInternational1to1BookingContextForGrok(
  result: ResolveInternational1to1BookingContextResult,
): string | null {
  if (result.status !== "ready") {
    return null;
  }
  return [
    "Le cabinet international a accepté explicitement les tarifications exposées dans le fil.",
    `Lien de planification unique (ne pas inventer) : ${result.bookingUrl}`,
    "Confirmez brièvement et incluez ce lien seul sur sa propre ligne.",
    "Ne pas renvoyer le briefing collectif France ni le lien conférence.",
  ].join("\n");
}
