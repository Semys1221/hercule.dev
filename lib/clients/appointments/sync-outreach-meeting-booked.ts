import type { ParsedCalendlyInvitee } from "@/lib/legacy/calendly";
import { bookLeadFromCalendly } from "@/lib/legacy/link-tracking/book-lead";
import {
  createLinkTrackingClient,
  findLeadByEmail,
  normalizeEmail,
} from "@/lib/legacy/link-tracking/supabase";

/**
 * Meniaud / DCE: Calendly is often routed through client_appointments first.
 * Promote the outreach row to MEETING_BOOKED only when the invitee email
 * matches the email stored on the comptable_delivery lead (Instantly outreach).
 */
export async function trySyncOutreachMeetingBookedFromInvitee(params: {
  invitee: ParsedCalendlyInvitee;
  calendlyPayload: unknown;
}): Promise<{ synced: boolean; reason?: string }> {
  const bookingEmail = normalizeEmail(params.invitee.email);
  if (!bookingEmail) {
    return { synced: false, reason: "missing_invitee_email" };
  }

  const client = createLinkTrackingClient();
  const lookup = await findLeadByEmail(client, bookingEmail);
  if (!lookup) {
    return { synced: false, reason: "outreach_lead_not_found" };
  }
  if (lookup.category !== "comptable_delivery") {
    return { synced: false, reason: "not_comptable_delivery" };
  }
  if (normalizeEmail(lookup.lead.email) !== bookingEmail) {
    return { synced: false, reason: "booking_email_mismatch" };
  }

  const questions: Record<string, string> = {};
  for (const qa of params.invitee.questionsAndAnswers) {
    if (qa.question) questions[qa.question] = qa.answer ?? "";
  }

  const result = await bookLeadFromCalendly({
    email: bookingEmail,
    slug: lookup.lead.slug,
    invitee: params.invitee,
    firstName: params.invitee.name.trim().split(/\s+/)[0] ?? params.invitee.name,
    scheduledAt: params.invitee.startTime || null,
    calendlyPayload:
      params.calendlyPayload && typeof params.calendlyPayload === "object"
        ? (params.calendlyPayload as Record<string, unknown>)
        : null,
    calendlyQuestions: Object.keys(questions).length > 0 ? questions : null,
  });

  if (result.reason === "booking_email_mismatch") {
    return { synced: false, reason: result.reason };
  }

  return {
    synced: Boolean(result.updated || result.instantlySynced),
    reason: result.reason,
  };
}
