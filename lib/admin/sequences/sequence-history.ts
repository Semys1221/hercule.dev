import { bookingSequenceTypesFor } from "@/lib/admin/email-sequences/registry";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import type { Niche } from "@/lib/admin/navigation";
import type { BypassTemplateKey } from "@/lib/instantly-bypass/types";

export type SequenceHistoryJob = {
  id: string;
  provider: "resend" | "instantly";
  sentAt: string | null;
  scheduledFor: string;
  email: string | null;
  step: string;
  status: string;
  providerId: string | null;
  triggeredBy: string | null;
  errorMessage: string | null;
  payload: Record<string, unknown> | null;
};

function sinceIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

async function lookupLeadEmails(
  category: Niche,
  leadIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (leadIds.length === 0) {
    return map;
  }

  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from(category)
    .select("id, email")
    .in("id", leadIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of (data ?? []) as Array<{ id: string; email: string }>) {
    map.set(row.id, row.email);
  }
  return map;
}

export async function listResendSequenceHistory(params: {
  niche: Niche;
  emailTypes: BookingEmailType[];
  days?: number;
}): Promise<SequenceHistoryJob[]> {
  const days = params.days ?? 30;
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("booking_email_jobs")
    .select(
      "id, lead_id, lead_category, email_type, status, scheduled_for, sent_at, resend_email_id, triggered_by, error_message",
    )
    .eq("lead_category", params.niche)
    .in("email_type", params.emailTypes)
    .gte("created_at", sinceIso(days))
    .order("scheduled_for", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<{
    id: string;
    lead_id: string;
    email_type: string;
    status: string;
    scheduled_for: string;
    sent_at: string | null;
    resend_email_id: string | null;
    triggered_by: string | null;
    error_message: string | null;
  }>;

  const leadIds = [...new Set(rows.map((row) => row.lead_id))];
  const emails = await lookupLeadEmails(params.niche, leadIds);

  return rows.map((row) => ({
    id: row.id,
    provider: "resend" as const,
    sentAt: row.sent_at,
    scheduledFor: row.scheduled_for,
    email: emails.get(row.lead_id) ?? null,
    step: row.email_type,
    status: row.status,
    providerId: row.resend_email_id,
    triggeredBy: row.triggered_by,
    errorMessage: row.error_message,
    payload: null,
  }));
}

export async function listInstantlySequenceHistory(params: {
  templateKeys: BypassTemplateKey[];
  days?: number;
}): Promise<SequenceHistoryJob[]> {
  const days = params.days ?? 30;
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("instantly_bypass_jobs")
    .select(
      "id, lead_email, template_key, status, scheduled_for, sent_at, error_message, payload",
    )
    .in("template_key", params.templateKeys)
    .gte("created_at", sinceIso(days))
    .order("scheduled_for", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<{
    id: string;
    lead_email: string;
    template_key: string;
    status: string;
    scheduled_for: string;
    sent_at: string | null;
    error_message: string | null;
    payload: Record<string, unknown> | null;
  }>).map((row) => ({
    id: row.id,
    provider: "instantly" as const,
    sentAt: row.sent_at,
    scheduledFor: row.scheduled_for,
    email: row.lead_email,
    step: row.template_key,
    status: row.status,
    providerId: null,
    triggeredBy: null,
    errorMessage: row.error_message,
    payload: row.payload,
  }));
}

export async function listSequenceHistory(params: {
  slug: string;
  niche: Niche;
  provider: "resend" | "instantly";
  emailTypes?: BookingEmailType[];
  templateKeys?: BypassTemplateKey[];
  days?: number;
}): Promise<SequenceHistoryJob[]> {
  if (params.provider === "instantly" && params.templateKeys?.length) {
    return listInstantlySequenceHistory({
      templateKeys: params.templateKeys,
      days: params.days,
    });
  }

  const emailTypes =
    params.emailTypes ??
    bookingSequenceTypesFor(params.slug, params.niche);

  if (emailTypes.length === 0) {
    return [];
  }

  return listResendSequenceHistory({
    niche: params.niche,
    emailTypes,
    days: params.days,
  });
}

export async function getResendJobDetail(jobId: string) {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("booking_email_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function getInstantlyJobDetail(jobId: string) {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("instantly_bypass_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}
