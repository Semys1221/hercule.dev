import {
  bookFromInbound,
  formatBookingContextForGrok,
  type BookFromInboundMode,
} from "@/lib/calendly/book-from-inbound";
import {
  isCalendlyBookingCanceled,
  listUpcomingBookings,
} from "@/lib/calendly/list-bookings";
import { resolveCategoryForCampaign } from "@/lib/link-tracking/provision-campaign-lead";
import { normalizeEmail } from "@/lib/link-tracking/supabase";
import type { LeadCategory } from "@/lib/link-tracking/types";

import {
  inboundClaimsBookingDone,
  inboundLooksLikePhoneRequest,
  inboundLooksLikeSchedulingAnswer,
  inboundShowsInterest,
} from "./inbound-question";
import { INTERESTED_STATUS } from "./reply-gate";

export async function leadHasUpcomingBooking(
  category: LeadCategory,
  leadEmail: string,
  replyFromEmail?: string | null,
): Promise<boolean> {
  const emails = new Set(
    [leadEmail, replyFromEmail]
      .map((value) => normalizeEmail(value ?? ""))
      .filter(Boolean),
  );
  const rows = await listUpcomingBookings({
    niche: category,
    daysAhead: 30,
    daysBehind: 0,
  });
  return rows.some(
    (row) =>
      emails.has(normalizeEmail(row.email)) &&
      !isCalendlyBookingCanceled(row) &&
      Boolean(row.calendly_reschedule_url?.trim()),
  );
}

/** Interested lead replied positively but did not confirm a Calendly booking. */
export function inboundNeedsBookingConfirmation(text: string): boolean {
  if (inboundLooksLikeSchedulingAnswer(text) || inboundLooksLikePhoneRequest(text)) {
    return false;
  }
  if (inboundClaimsBookingDone(text)) {
    return false;
  }
  return inboundShowsInterest(text);
}

export function formatPendingBookingConfirmationContext(): string {
  return [
    "Le cabinet a répondu positivement mais aucun rendez-vous Calendly n'est enregistré pour cet email.",
    "Accusez réception de son message (reformulez brièvement ce qu'il partage, sans « Merci pour votre message »).",
    "Demandez poliment s'il peut confirmer qu'il a bien réservé son créneau via le lien envoyé.",
    "Redirect : inclure le lien CTA briefing collectif fourni s'il n'a pas encore réservé.",
    "Ne présumez pas que le rendez-vous est pris ; ne confirmez pas un créneau inventé.",
  ].join("\n");
}

async function resolveAutoBookContext(params: {
  category: LeadCategory;
  inboundText: string;
  leadEmail: string;
  replyFromEmail?: string | null;
  leadName: string;
}): Promise<string | null> {
  const mode: BookFromInboundMode = inboundLooksLikeSchedulingAnswer(params.inboundText)
    ? "try_book"
    : inboundLooksLikePhoneRequest(params.inboundText)
      ? "suggest_slots"
      : "none";

  const result = await bookFromInbound({
    event: params.category,
    leadEmail: params.leadEmail,
    replyFromEmail: params.replyFromEmail,
    leadName: params.leadName,
    inboundText: params.inboundText,
    mode,
  });
  return formatBookingContextForGrok(result);
}

async function resolvePendingBookingContext(params: {
  category: LeadCategory;
  inboundText: string;
  leadEmail: string;
  replyFromEmail?: string | null;
  interestStatus: number | null | undefined;
}): Promise<string | null> {
  if (params.interestStatus !== INTERESTED_STATUS) {
    return null;
  }
  if (!inboundNeedsBookingConfirmation(params.inboundText)) {
    return null;
  }
  const hasBooking = await leadHasUpcomingBooking(
    params.category,
    params.leadEmail,
    params.replyFromEmail,
  );
  if (hasBooking) {
    return null;
  }
  return formatPendingBookingConfirmationContext();
}

export async function resolveBookingContext(params: {
  campaignId: string;
  inboundText: string;
  leadEmail: string;
  replyFromEmail?: string | null;
  leadName: string;
  interestStatus?: number | null;
}): Promise<string | null> {
  try {
    const category = await resolveCategoryForCampaign(params.campaignId);
    if (category !== "comptable" && category !== "cif") {
      return null;
    }

    const autoBookContext = await resolveAutoBookContext({
      category,
      inboundText: params.inboundText,
      leadEmail: params.leadEmail,
      replyFromEmail: params.replyFromEmail,
      leadName: params.leadName,
    });
    if (autoBookContext) {
      return autoBookContext;
    }

    return await resolvePendingBookingContext({
      category,
      inboundText: params.inboundText,
      leadEmail: params.leadEmail,
      replyFromEmail: params.replyFromEmail,
      interestStatus: params.interestStatus,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[ai-reply-agent] booking context failed:", message);
    return null;
  }
}
