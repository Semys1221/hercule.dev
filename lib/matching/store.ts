import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import type { LeadCategory } from "@/lib/link-tracking/types";

export type MatchStatus = "proposed" | "booked" | "sold";

export type MatchRow = {
  id: string;
  agence_id: string;
  entreprise_id: string;
  status: MatchStatus;
  calendly_url: string | null;
  proposal_sent_at: string | null;
  followup_sent_at: string | null;
  booking_at: string | null;
  surveys_sent_at: string | null;
  agence_survey_token: string | null;
  entreprise_survey_token: string | null;
  agence_survey_responded_at: string | null;
  entreprise_survey_responded_at: string | null;
  sale_made: boolean | null;
  search_started_at: string | null;
  meeting_duration_minutes: number;
  created_at: string;
};

function mapRow(data: Record<string, unknown>): MatchRow {
  return {
    id: String(data.id),
    agence_id: String(data.agence_id),
    entreprise_id: String(data.entreprise_id),
    status: data.status as MatchStatus,
    calendly_url: (data.calendly_url as string | null) ?? null,
    proposal_sent_at: (data.proposal_sent_at as string | null) ?? null,
    followup_sent_at: (data.followup_sent_at as string | null) ?? null,
    booking_at: (data.booking_at as string | null) ?? null,
    surveys_sent_at: (data.surveys_sent_at as string | null) ?? null,
    agence_survey_token: (data.agence_survey_token as string | null) ?? null,
    entreprise_survey_token: (data.entreprise_survey_token as string | null) ?? null,
    agence_survey_responded_at: (data.agence_survey_responded_at as string | null) ?? null,
    entreprise_survey_responded_at:
      (data.entreprise_survey_responded_at as string | null) ?? null,
    sale_made: (data.sale_made as boolean | null) ?? null,
    search_started_at: (data.search_started_at as string | null) ?? null,
    meeting_duration_minutes: Number(data.meeting_duration_minutes ?? 30),
    created_at: String(data.created_at),
  };
}

export async function insertMatch(params: {
  agenceId: string;
  entrepriseId: string;
  calendlyUrl: string;
}): Promise<MatchRow> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("matches")
    .insert({
      agence_id: params.agenceId,
      entreprise_id: params.entrepriseId,
      status: "proposed",
      calendly_url: params.calendlyUrl,
      proposal_sent_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "match_insert_failed");
  }
  return mapRow(data as Record<string, unknown>);
}

export async function findMatchById(id: string): Promise<MatchRow | null> {
  const client = createLinkTrackingClient();
  const { data, error } = await client.from("matches").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function listMatches(): Promise<MatchRow[]> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("matches")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function updateMatch(
  id: string,
  patch: Record<string, unknown>,
): Promise<MatchRow> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("matches")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "match_update_failed");
  }
  return mapRow(data as Record<string, unknown>);
}

export async function findMatchForLeadEmailType(
  category: LeadCategory,
  leadId: string,
  emailType: BookingEmailType,
): Promise<MatchRow | null> {
  const client = createLinkTrackingClient();
  const column = category === "agence" ? "agence_id" : "entreprise_id";
  let query = client.from("matches").select("*").eq(column, leadId);

  if (emailType.startsWith("survey_")) {
    query = query.not("surveys_sent_at", "is", null);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(1);
  if (error) throw new Error(error.message);
  const row = data?.[0];
  return row ? mapRow(row as Record<string, unknown>) : null;
}

export async function findMatchBySurveyToken(token: string): Promise<MatchRow | null> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("matches")
    .select("*")
    .or(`agence_survey_token.eq.${token},entreprise_survey_token.eq.${token}`)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function listEndedBookedMatches(): Promise<MatchRow[]> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("matches")
    .select("*")
    .eq("status", "booked")
    .is("surveys_sent_at", null)
    .not("booking_at", "is", null);
  if (error) throw new Error(error.message);
  const now = Date.now();
  return (data ?? [])
    .map((row) => mapRow(row as Record<string, unknown>))
    .filter((match) => {
      if (!match.booking_at) return false;
      const end =
        new Date(match.booking_at).getTime() +
        match.meeting_duration_minutes * 60_000;
      return end <= now;
    });
}
