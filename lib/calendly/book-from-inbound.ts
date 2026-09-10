import { createInvitee } from "@/lib/calendly/create-invitee";
import {
  type CalendlyBookingEvent,
  findNextAvailableSlotsForEventType,
  formatFrenchSlotLabel,
  getEventTypeUri,
} from "@/lib/calendly/availability";
import { listUpcomingBookings } from "@/lib/calendly/list-bookings";
import { matchInboundSlot, type SlotCandidate } from "@/lib/calendly/match-inbound-slot";
import { normalizeEmail } from "@/lib/link-tracking/supabase";

export type BookFromInboundMode = "none" | "suggest_slots" | "try_book";

export type BookFromInboundParams = {
  event: CalendlyBookingEvent;
  leadEmail: string;
  leadName: string;
  inboundText: string;
  mode: BookFromInboundMode;
};

export type BookFromInboundResult =
  | { status: "disabled" }
  | { status: "skipped"; reason: string }
  | { status: "already_booked"; slotLabel: string; rescheduleUrl: string }
  | {
      status: "booked";
      slotLabel: string;
      startTime: string;
      rescheduleUrl: string;
      cancelUrl: string;
    }
  | { status: "suggest_slots"; slots: SlotCandidate[] }
  | { status: "ambiguous"; slots: SlotCandidate[] }
  | { status: "no_match" };

export function isCalendlyAutoBookEnabled(): boolean {
  return process.env.AI_REPLY_AGENT_CALENDLY_AUTO_BOOK?.trim() === "true";
}

async function loadSlotCandidates(
  event: CalendlyBookingEvent,
  count = 30,
): Promise<{ eventTypeUri: string; slots: SlotCandidate[] }> {
  const eventTypeUri = await getEventTypeUri(event);
  const dates = await findNextAvailableSlotsForEventType(eventTypeUri, count, 14);
  const slots = dates.map((start) => ({
    startTime: start.toISOString(),
    label: formatFrenchSlotLabel(start),
  }));
  return { eventTypeUri, slots };
}

async function findExistingFutureBooking(
  event: CalendlyBookingEvent,
  leadEmail: string,
): Promise<{ slotLabel: string; rescheduleUrl: string } | null> {
  const normalized = normalizeEmail(leadEmail);
  const rows = await listUpcomingBookings({
    niche: event,
    daysAhead: 30,
    daysBehind: 0,
  });
  const match = rows.find(
    (row) =>
      normalizeEmail(row.email) === normalized &&
      row.calendly_reschedule_url?.trim(),
  );
  if (!match) {
    return null;
  }
  return {
    slotLabel: formatFrenchSlotLabel(new Date(match.start_time)),
    rescheduleUrl: match.calendly_reschedule_url ?? "",
  };
}

export async function bookFromInbound(
  params: BookFromInboundParams,
): Promise<BookFromInboundResult> {
  if (!isCalendlyAutoBookEnabled()) {
    return { status: "disabled" };
  }

  if (params.mode === "none") {
    return { status: "skipped", reason: "no_scheduling_intent" };
  }

  const existing = await findExistingFutureBooking(params.event, params.leadEmail);
  if (existing) {
    return {
      status: "already_booked",
      slotLabel: existing.slotLabel,
      rescheduleUrl: existing.rescheduleUrl,
    };
  }

  const { eventTypeUri, slots } = await loadSlotCandidates(params.event);
  if (slots.length === 0) {
    return { status: "no_match" };
  }

  if (params.mode === "suggest_slots") {
    return {
      status: "suggest_slots",
      slots: slots.slice(0, 2),
    };
  }

  const match = matchInboundSlot(params.inboundText, slots);
  if (match.kind === "matched") {
    const booked = await createInvitee({
      eventTypeUri,
      startTime: match.startTime,
      inviteeEmail: params.leadEmail,
      inviteeName: params.leadName,
    });
    return {
      status: "booked",
      slotLabel: match.label,
      startTime: booked.startTime,
      rescheduleUrl: booked.rescheduleUrl,
      cancelUrl: booked.cancelUrl,
    };
  }

  if (match.kind === "ambiguous") {
    return {
      status: "ambiguous",
      slots: match.suggestions,
    };
  }

  return { status: "no_match" };
}

export function formatBookingContextForGrok(
  result: BookFromInboundResult,
): string | null {
  switch (result.status) {
    case "disabled":
    case "skipped":
    case "no_match":
      return null;
    case "already_booked":
      return [
        "Un rendez-vous Calendly est déjà planifié pour ce cabinet.",
        `Créneau : ${result.slotLabel}.`,
        `Lien de replanification (ne pas inventer) : ${result.rescheduleUrl}`,
        "Confirmez poliment que le créneau est bien noté.",
      ].join("\n");
    case "booked":
      return [
        "Un rendez-vous Calendly a été créé automatiquement pour ce cabinet.",
        `Créneau confirmé : ${result.slotLabel}.`,
        `Lien de replanification (ne pas inventer) : ${result.rescheduleUrl}`,
        "Confirmez la visio Zoom planifiée ; ne propose pas un appel téléphonique ad hoc.",
      ].join("\n");
    case "suggest_slots":
      return [
        "Le cabinet demande un contact téléphonique ou refuse le formulaire.",
        "Demandez à quelles heures il serait disponible cette semaine pour une visio.",
        `Proposez ces créneaux Calendly (ne pas inventer d'autres horaires) : ${result.slots
          .map((slot) => slot.label)
          .join(" ou ")}.`,
      ].join("\n");
    case "ambiguous":
      return [
        "Le cabinet a indiqué une disponibilité mais le créneau n'est pas clair.",
        `Proposez de choisir entre : ${result.slots.map((slot) => slot.label).join(" ou ")}.`,
        "Demandez confirmation du créneau préféré pour planifier la visio.",
      ].join("\n");
    default:
      return null;
  }
}
