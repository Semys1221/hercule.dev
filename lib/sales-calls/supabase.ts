import type { SupabaseClient } from "@supabase/supabase-js";

import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";

import type { SalesCall, SalesCallNotesPatch, SalesCallStatus } from "./types";

export function createSalesCallsClient(): SupabaseClient {
  return createLinkTrackingClient();
}

export type UpsertSalesCallParams = {
  agenceId?: string | null;
  entrepriseId?: string | null;
  comptableId?: string | null;
  cifId?: string | null;
  email: string;
  inviteeUri: string;
  scheduledAt?: string | null;
  status?: SalesCallStatus;
};

export async function upsertSalesCallFromBooking(
  client: SupabaseClient,
  params: UpsertSalesCallParams,
): Promise<SalesCall> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const { data: existing, error: lookupError } = await client
    .from("sales_calls")
    .select("*")
    .eq("calendly_invitee_uri", params.inviteeUri)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`sales_calls lookup failed: ${lookupError.message}`);
  }

  if (existing) {
    const patch: Record<string, unknown> = {};
    if (params.agenceId && !existing.agence_id) {
      patch.agence_id = params.agenceId;
    }
    if (params.entrepriseId && !existing.entreprise_id) {
      patch.entreprise_id = params.entrepriseId;
    }
    if (params.comptableId && !existing.comptable_id) {
      patch.comptable_id = params.comptableId;
    }
    if (params.cifId && !existing.cif_id) {
      patch.cif_id = params.cifId;
    }
    if (params.scheduledAt) {
      patch.scheduled_at = params.scheduledAt;
    }
    if (normalizedEmail && normalizedEmail !== String(existing.email ?? "").trim().toLowerCase()) {
      patch.email = normalizedEmail;
    }
    if (Object.keys(patch).length === 0) {
      return existing as SalesCall;
    }

    const { data, error } = await client
      .from("sales_calls")
      .update(patch)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`sales_calls update failed: ${error?.message ?? "no row"}`);
    }
    return data as SalesCall;
  }

  const { data, error } = await client
    .from("sales_calls")
    .insert({
      agence_id: params.agenceId ?? null,
      entreprise_id: params.entrepriseId ?? null,
      comptable_id: params.comptableId ?? null,
      cif_id: params.cifId ?? null,
      email: normalizedEmail,
      calendly_invitee_uri: params.inviteeUri,
      scheduled_at: params.scheduledAt ?? null,
      status: params.status ?? "scheduled",
      notes: {},
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`sales_calls insert failed: ${error?.message ?? "no row"}`);
  }

  return data as SalesCall;
}

export async function findSalesCallStatusesByInviteeUris(
  client: SupabaseClient,
  inviteeUris: string[],
): Promise<Map<string, SalesCallStatus>> {
  const uniqueUris = [...new Set(inviteeUris.filter((uri) => uri.trim()))];
  const statuses = new Map<string, SalesCallStatus>();
  if (uniqueUris.length === 0) {
    return statuses;
  }

  const { data, error } = await client
    .from("sales_calls")
    .select("calendly_invitee_uri, status")
    .in("calendly_invitee_uri", uniqueUris);

  if (error) {
    throw new Error(`sales_calls batch lookup failed: ${error.message}`);
  }

  for (const row of data ?? []) {
    const uri = String(row.calendly_invitee_uri ?? "").trim();
    const status = row.status as SalesCallStatus | null;
    if (uri && status) {
      statuses.set(uri, status);
    }
  }

  return statuses;
}

export async function findSalesCallByInviteeUri(
  client: SupabaseClient,
  inviteeUri: string,
): Promise<SalesCall | null> {
  const { data, error } = await client
    .from("sales_calls")
    .select("*")
    .eq("calendly_invitee_uri", inviteeUri)
    .maybeSingle();

  if (error) {
    throw new Error(`sales_calls lookup failed: ${error.message}`);
  }

  return (data as SalesCall | null) ?? null;
}

export async function findSalesCallById(
  client: SupabaseClient,
  salesCallId: string,
): Promise<SalesCall | null> {
  const { data, error } = await client
    .from("sales_calls")
    .select("*")
    .eq("id", salesCallId)
    .maybeSingle();

  if (error) {
    throw new Error(`sales_calls lookup failed: ${error.message}`);
  }

  return (data as SalesCall | null) ?? null;
}

export async function findLatestSalesCallByAgenceId(
  client: SupabaseClient,
  agenceId: string,
): Promise<SalesCall | null> {
  const { data, error } = await client
    .from("sales_calls")
    .select("*")
    .eq("agence_id", agenceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`sales_calls agence lookup failed: ${error.message}`);
  }

  return (data as SalesCall | null) ?? null;
}

export async function findLatestSalesCallByComptableId(
  client: SupabaseClient,
  comptableId: string,
): Promise<SalesCall | null> {
  const { data, error } = await client
    .from("sales_calls")
    .select("*")
    .eq("comptable_id", comptableId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`sales_calls comptable lookup failed: ${error.message}`);
  }

  return (data as SalesCall | null) ?? null;
}

export async function updateSalesCallNotes(
  client: SupabaseClient,
  salesCallId: string,
  notesPatch: SalesCallNotesPatch,
): Promise<SalesCall> {
  const existing = await findSalesCallById(client, salesCallId);
  if (!existing) {
    throw new Error("sales_call_not_found");
  }

  const mergedNotes = {
    ...existing.notes,
    ...(notesPatch.qualification
      ? { qualification: { ...(existing.notes.qualification as object), ...notesPatch.qualification } }
      : {}),
    ...(notesPatch.closing
      ? { closing: { ...(existing.notes.closing as object), ...notesPatch.closing } }
      : {}),
  };

  const { data, error } = await client
    .from("sales_calls")
    .update({ notes: mergedNotes })
    .eq("id", salesCallId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`sales_calls notes update failed: ${error?.message ?? "no row"}`);
  }

  return data as SalesCall;
}

export async function updateSalesCallStatus(
  client: SupabaseClient,
  salesCallId: string,
  status: SalesCallStatus,
): Promise<SalesCall> {
  const { data, error } = await client
    .from("sales_calls")
    .update({ status })
    .eq("id", salesCallId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`sales_calls status update failed: ${error?.message ?? "no row"}`);
  }
  return data as SalesCall;
}

export async function replaceSalesCallNotesSection(
  client: SupabaseClient,
  salesCallId: string,
  section: "qualification" | "closing",
  value: Record<string, unknown>,
): Promise<SalesCall> {
  const existing = await findSalesCallById(client, salesCallId);
  if (!existing) {
    throw new Error("sales_call_not_found");
  }

  const mergedNotes = {
    ...existing.notes,
    [section]: value,
  };

  const { data, error } = await client
    .from("sales_calls")
    .update({ notes: mergedNotes })
    .eq("id", salesCallId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`sales_calls notes replace failed: ${error?.message ?? "no row"}`);
  }

  return data as SalesCall;
}
