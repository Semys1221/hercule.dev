import type { SupabaseClient } from "@supabase/supabase-js";

import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";

import type { ClientAppointmentPublic, ClientAppointmentRow, ClientAppointmentStatus } from "./types";

function asRow(data: unknown): ClientAppointmentRow {
  const row = data as ClientAppointmentRow;
  return {
    ...row,
    questions:
      row.questions && typeof row.questions === "object"
        ? (row.questions as Record<string, string>)
        : {},
  };
}

export function toPublicAppointment(
  row: ClientAppointmentRow,
): ClientAppointmentPublic {
  return {
    id: row.id,
    inviteeName: row.invitee_name,
    inviteeEmail: row.invitee_email,
    scheduledAt: row.scheduled_at,
    status: row.status,
    questions: row.questions ?? {},
    joinUrl: row.join_url,
    canAct: row.status === "scheduled",
  };
}

export async function listClientAppointments(
  clientId: string,
  client: SupabaseClient = createLinkTrackingClient(),
): Promise<ClientAppointmentRow[]> {
  const { data, error } = await client
    .from("client_appointments")
    .select("*")
    .eq("client_id", clientId)
    .order("scheduled_at", { ascending: false });

  if (error) {
    if (
      error.message.includes("does not exist") ||
      error.message.includes("schema cache")
    ) {
      return [];
    }
    throw new Error(error.message);
  }
  return (data ?? []).map(asRow);
}

export async function findClientAppointmentById(
  id: string,
  client: SupabaseClient = createLinkTrackingClient(),
): Promise<ClientAppointmentRow | null> {
  const { data, error } = await client
    .from("client_appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? asRow(data) : null;
}

export async function findClientAppointmentByInviteeUri(
  inviteeUri: string,
  client: SupabaseClient = createLinkTrackingClient(),
): Promise<ClientAppointmentRow | null> {
  const { data, error } = await client
    .from("client_appointments")
    .select("*")
    .eq("calendly_invitee_uri", inviteeUri)
    .maybeSingle();
  if (error) {
    if (
      error.message.includes("does not exist") ||
      error.message.includes("schema cache")
    ) {
      return null;
    }
    throw new Error(error.message);
  }
  return data ? asRow(data) : null;
}

export async function insertClientAppointment(
  params: {
    clientId: string;
    calendlyInviteeUri: string;
    calendlyEventUri?: string | null;
    calendlyEventTypeUri?: string | null;
    inviteeEmail: string;
    inviteeName?: string | null;
    questions?: Record<string, string>;
    scheduledAt?: string | null;
    credited?: boolean;
    joinUrl?: string | null;
    status?: ClientAppointmentStatus;
  },
  client: SupabaseClient = createLinkTrackingClient(),
): Promise<{ row: ClientAppointmentRow; inserted: boolean }> {
  const existing = await findClientAppointmentByInviteeUri(
    params.calendlyInviteeUri,
    client,
  );
  if (existing) {
    return { row: existing, inserted: false };
  }

  const { data, error } = await client
    .from("client_appointments")
    .insert({
      client_id: params.clientId,
      calendly_invitee_uri: params.calendlyInviteeUri,
      calendly_event_uri: params.calendlyEventUri ?? null,
      calendly_event_type_uri: params.calendlyEventTypeUri ?? null,
      invitee_email: params.inviteeEmail,
      invitee_name: params.inviteeName ?? null,
      questions: params.questions ?? {},
      scheduled_at: params.scheduledAt ?? null,
      credited: params.credited ?? true,
      join_url: params.joinUrl ?? null,
      status: params.status ?? "scheduled",
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      const raced = await findClientAppointmentByInviteeUri(
        params.calendlyInviteeUri,
        client,
      );
      if (raced) return { row: raced, inserted: false };
    }
    throw new Error(error.message);
  }
  return { row: asRow(data), inserted: true };
}

export async function updateClientAppointment(
  id: string,
  patch: Partial<{
    status: ClientAppointmentStatus;
    credited: boolean;
    calendly_event_uri: string | null;
    calendly_event_type_uri: string | null;
    scheduled_at: string | null;
  }>,
  client: SupabaseClient = createLinkTrackingClient(),
): Promise<ClientAppointmentRow> {
  const { data, error } = await client
    .from("client_appointments")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "appointment_update_failed");
  }
  return asRow(data);
}
