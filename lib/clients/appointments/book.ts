import type { ParsedCalendlyInvitee } from "@/lib/legacy/calendly";
import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";

import { resolveHostEmailsAndEventType } from "./calendly-event";
import { incrementClientRdvUsed } from "./credits";
import { findClientHostByEmails } from "./find-host";
import {
  eventUriFromScheduled,
  questionsFromPairs,
  scheduledEventFromCreatedPayload,
} from "./format";
import { sendNewAppointmentEmails } from "./notify";
import { insertClientAppointment } from "./store";

export async function tryBookClientDeliveryAppointment(params: {
  invitee: ParsedCalendlyInvitee;
  payload: unknown;
}): Promise<{ handled: true; appointmentId: string } | { handled: false }> {
  const scheduled = scheduledEventFromCreatedPayload(params.payload);
  const { hostEmails, eventTypeUri } = await resolveHostEmailsAndEventType({
    scheduled,
    eventUuid: params.invitee.eventUuid,
  });
  if (hostEmails.length === 0) {
    return { handled: false };
  }

  const supabase = createLinkTrackingClient();
  const clientRow = await findClientHostByEmails(hostEmails, supabase);
  if (!clientRow) {
    return { handled: false };
  }

  const questions = questionsFromPairs(params.invitee.questionsAndAnswers);
  const { row, inserted } = await insertClientAppointment(
    {
      clientId: clientRow.id,
      calendlyInviteeUri: params.invitee.inviteeUri,
      calendlyEventUri:
        eventUriFromScheduled(scheduled) ??
        (params.invitee.eventUuid
          ? `https://api.calendly.com/scheduled_events/${params.invitee.eventUuid}`
          : null),
      calendlyEventTypeUri: eventTypeUri,
      inviteeEmail: params.invitee.email,
      inviteeName: params.invitee.name,
      questions,
      scheduledAt: params.invitee.startTime || null,
      joinUrl: params.invitee.joinUrl,
      credited: true,
    },
    supabase,
  );

  if (!inserted) {
    return { handled: true, appointmentId: row.id };
  }

  let updatedClient = clientRow;
  if (row.credited) {
    updatedClient = await incrementClientRdvUsed(clientRow.id, supabase);
  }

  await sendNewAppointmentEmails({
    client: updatedClient,
    appointment: row,
    overbooked: updatedClient.rdv_used > updatedClient.rdv_total,
  });

  return { handled: true, appointmentId: row.id };
}
