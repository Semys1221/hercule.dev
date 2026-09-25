import type { SupabaseClient } from "@supabase/supabase-js";

import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";

import type { SalesCall, SalesCallNotesPatch, SalesCallStatus } from "./types";

export function createSalesCallsClient(): SupabaseClient {
  return createLinkTrackingClient();
}

export type UpsertSalesCallParams = {
  leadId?: string | null;
  /** @deprecated use leadId */
  comptableId?: string | null;
  /** @deprecated use leadId */
  cifId?: string | null;
  /** @deprecated use leadId */
  comptableDeliveryId?: string | null;
  /** @deprecated */
  jumId?: string | null;
  email: string;
  inviteeUri: string;
  scheduledAt?: string | null;
  status?: SalesCallStatus;
};

function resolveLeadId(params: UpsertSalesCallParams): string | null {
  return (
    params.leadId ??
    params.comptableId ??
    params.cifId ??
    params.comptableDeliveryId ??
    params.jumId ??
    null
  );
}

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

  const leadId = resolveLeadId(params);

  if (existing) {
    const patch: Record<string, unknown> = {};
    if (leadId && !existing.lead_id) {
      patch.lead_id = leadId;
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
      lead_id: leadId,
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

export async function findLatestSalesCallByLeadId(
  client: SupabaseClient,
  leadId: string,
): Promise<SalesCall | null> {
  const { data, error } = await client
    .from("sales_calls")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`sales_calls lead lookup failed: ${error.message}`);
  }

  return (data as SalesCall | null) ?? null;
}

/** @deprecated Agence product removed — use findLatestSalesCallByLeadId */
export async function findLatestSalesCallByAgenceId(
  _client: SupabaseClient,
  _agenceId: string,
): Promise<SalesCall | null> {
  return null;
}

/** @deprecated use findLatestSalesCallByLeadId */
export async function findLatestSalesCallByComptableId(
  client: SupabaseClient,
  comptableId: string,
): Promise<SalesCall | null> {
  return findLatestSalesCallByLeadId(client, comptableId);
}

/** @deprecated use findLatestSalesCallByLeadId */
export async function findLatestSalesCallByCifId(
  client: SupabaseClient,
  cifId: string,
): Promise<SalesCall | null> {
  return findLatestSalesCallByLeadId(client, cifId);
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
