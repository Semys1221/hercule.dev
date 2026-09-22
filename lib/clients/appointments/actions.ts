import type { SupabaseClient } from "@supabase/supabase-js";

import {
  cancelScheduledEvent,
  extractUuidFromCalendlyUri,
} from "@/lib/legacy/calendly";
import { createInvitee } from "@/lib/legacy/calendly/create-invitee";
import { nextAvailableEventTypeStartTime } from "@/lib/legacy/calendly/event-type-available-times";
import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";

import { findClientBySlug } from "../supabase";
import type { ClientRow } from "../types";
import { decrementClientRdvUsed } from "./credits";
import { formatParisDate } from "./format";
import { sendInviteeStatusEmail } from "./notify";
import {
  findClientAppointmentById,
  insertClientAppointment,
  updateClientAppointment,
} from "./store";
import type { ClientAppointmentRow } from "./types";

class AppointmentActionError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "AppointmentActionError";
  }
}

async function loadOwnedAppointment(params: {
  supabase: SupabaseClient;
  slug: string;
  appointmentId: string;
}): Promise<{ client: ClientRow; appointment: ClientAppointmentRow }> {
  const client = await findClientBySlug(params.supabase, params.slug);
  if (!client) {
    throw new AppointmentActionError("Client not found", 404);
  }
  const appointment = await findClientAppointmentById(
    params.appointmentId,
    params.supabase,
  );
  if (!appointment || appointment.client_id !== client.id) {
    throw new AppointmentActionError("Rendez-vous introuvable", 404);
  }
  return { client, appointment };
}

function eventUuidFromAppointment(appointment: ClientAppointmentRow): string {
  const fromUri = appointment.calendly_event_uri
    ? extractUuidFromCalendlyUri(appointment.calendly_event_uri)
    : "";
  if (fromUri) return fromUri;
  const fromInvitee = extractUuidFromCalendlyUri(
    appointment.calendly_invitee_uri.split("/invitees/")[0] ?? "",
  );
  return fromInvitee;
}

async function refundIfCredited(
  appointment: ClientAppointmentRow,
  supabase: SupabaseClient,
): Promise<void> {
  if (!appointment.credited) return;
  await decrementClientRdvUsed(appointment.client_id, supabase);
  await updateClientAppointment(
    appointment.id,
    { credited: false },
    supabase,
  );
}

export async function reportAppointmentNoshow(params: {
  slug: string;
  appointmentId: string;
}): Promise<{ appointment: ClientAppointmentRow }> {
  const supabase = createLinkTrackingClient();
  const { appointment } = await loadOwnedAppointment({
    supabase,
    slug: params.slug,
    appointmentId: params.appointmentId,
  });
  if (appointment.status !== "scheduled") {
    throw new AppointmentActionError("Ce rendez-vous n'est plus actif", 409);
  }
  await refundIfCredited(appointment, supabase);
  const updated = await updateClientAppointment(
    appointment.id,
    { status: "no_show" },
    supabase,
  );
  return { appointment: updated };
}

export async function refuseAppointment(params: {
  slug: string;
  appointmentId: string;
}): Promise<{ appointment: ClientAppointmentRow }> {
  const supabase = createLinkTrackingClient();
  const { appointment } = await loadOwnedAppointment({
    supabase,
    slug: params.slug,
    appointmentId: params.appointmentId,
  });
  if (appointment.status !== "scheduled") {
    throw new AppointmentActionError("Ce rendez-vous n'est plus actif", 409);
  }

  await refundIfCredited(appointment, supabase);
  const updated = await updateClientAppointment(
    appointment.id,
    { status: "refused" },
    supabase,
  );

  const eventUuid = eventUuidFromAppointment(appointment);
  if (eventUuid) {
    await cancelScheduledEvent(eventUuid, "Refusé par le cabinet");
  }

  await sendInviteeStatusEmail({
    to: appointment.invitee_email,
    subject: "Votre rendez-vous a été annulé",
    text: [
      appointment.invitee_name
        ? `Bonjour ${appointment.invitee_name},`
        : "Bonjour,",
      "",
      `Le rendez-vous prévu le ${formatParisDate(appointment.scheduled_at)} a été annulé.`,
      "",
      "L'équipe Hercule",
    ].join("\n"),
    idempotencyKey: `client-appt-refused:${appointment.id}`,
  });

  return { appointment: updated };
}

export async function rescheduleAppointment(params: {
  slug: string;
  appointmentId: string;
}): Promise<{ appointment: ClientAppointmentRow; nextStart: string }> {
  const supabase = createLinkTrackingClient();
  const { appointment } = await loadOwnedAppointment({
    supabase,
    slug: params.slug,
    appointmentId: params.appointmentId,
  });
  if (appointment.status !== "scheduled") {
    throw new AppointmentActionError("Ce rendez-vous n'est plus actif", 409);
  }
  if (!appointment.calendly_event_type_uri) {
    throw new AppointmentActionError(
      "Impossible de replanifier : event type Calendly manquant",
      409,
    );
  }

  const nextStart = await nextAvailableEventTypeStartTime(
    appointment.calendly_event_type_uri,
  );
  if (!nextStart) {
    throw new AppointmentActionError(
      "Aucun créneau disponible pour replanifier automatiquement",
      409,
    );
  }

  const booked = await createInvitee({
    eventTypeUri: appointment.calendly_event_type_uri,
    startTime: nextStart,
    inviteeEmail: appointment.invitee_email,
    inviteeName: appointment.invitee_name ?? appointment.invitee_email,
  });

  await insertClientAppointment(
    {
      clientId: appointment.client_id,
      calendlyInviteeUri: booked.inviteeUri,
      calendlyEventUri: booked.eventUri,
      calendlyEventTypeUri: appointment.calendly_event_type_uri,
      inviteeEmail: appointment.invitee_email,
      inviteeName: appointment.invitee_name,
      questions: appointment.questions,
      scheduledAt: booked.startTime,
      credited: false,
    },
    supabase,
  );

  const updated = await updateClientAppointment(
    appointment.id,
    { status: "rescheduled" },
    supabase,
  );

  const eventUuid = eventUuidFromAppointment(appointment);
  if (eventUuid) {
    await cancelScheduledEvent(eventUuid, "Replanifié par le cabinet");
  }

  await sendInviteeStatusEmail({
    to: appointment.invitee_email,
    subject: "Votre rendez-vous a été déplacé",
    text: [
      appointment.invitee_name
        ? `Bonjour ${appointment.invitee_name},`
        : "Bonjour,",
      "",
      `Le rendez-vous du ${formatParisDate(appointment.scheduled_at)} a été déplacé.`,
      `Nouveau créneau : ${formatParisDate(booked.startTime)}.`,
      booked.rescheduleUrl
        ? `Lien : ${booked.rescheduleUrl}`
        : null,
      "",
      "L'équipe Hercule",
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
    idempotencyKey: `client-appt-reschedule:${appointment.id}:${booked.inviteeUri}`,
  });

  return { appointment: updated, nextStart: booked.startTime };
}

export function appointmentActionHttpStatus(error: unknown): number {
  if (error instanceof AppointmentActionError) return error.status;
  if (error instanceof Error && error.message === "Client not found") return 404;
  return 500;
}
