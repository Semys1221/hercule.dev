import type { SupabaseClient } from "@supabase/supabase-js";

import {
  attributionsForOfferType,
  formulaLabelForOfferType,
  OFFER_TYPES,
} from "@/lib/commercial/constants";
import type { DemandeVersoFields } from "@/lib/commercial/qualification-criteria";
import type {
  DashboardDeliveryPlan,
  DashboardEnterpriseBrief,
} from "@/lib/dashboard/types";
import { findLeadById } from "@/lib/link-tracking/supabase";
import type { MatchRow, MatchStatus } from "@/lib/matching/store";

const ATTRIBUTION_COUNT_STATUSES = new Set<MatchStatus>(["booked", "sold"]);
const ACTIVE_BRIEF_STATUSES = new Set<MatchStatus>(["proposed", "booked"]);

function mapMatchRow(data: Record<string, unknown>): MatchRow {
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

function buildDeliveryPlan(
  offerType: string | null,
  matches: MatchRow[],
): DashboardDeliveryPlan {
  const attributionsTotal = attributionsForOfferType(offerType);
  const formulaLabel = formulaLabelForOfferType(offerType);
  const attributionsUsed = matches.filter((match) =>
    ATTRIBUTION_COUNT_STATUSES.has(match.status),
  ).length;

  return {
    formulaLabel,
    attributionsTotal,
    attributionsUsed,
  };
}

function mapBriefStatus(status: MatchStatus): DashboardEnterpriseBrief["status"] {
  if (status === "sold") return "completed";
  return status;
}

function readStringField(
  source: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function buildVersoFields(source: Record<string, unknown>): DemandeVersoFields | undefined {
  const dureeSouhaitee = readStringField(source, "dureeSouhaitee", "duree_souhaitee");
  const horizonResultat = readStringField(source, "horizonResultat", "horizon_resultat");
  const historiqueAgences = readStringField(
    source,
    "historiqueAgences",
    "historique_agences",
  );

  if (!dureeSouhaitee && !horizonResultat && !historiqueAgences) {
    return undefined;
  }

  return {
    dureeSouhaitee: dureeSouhaitee ?? "—",
    horizonResultat: horizonResultat ?? "—",
    historiqueAgences: historiqueAgences ?? "—",
  };
}

async function buildEnterpriseBrief(
  client: SupabaseClient,
  match: MatchRow,
): Promise<DashboardEnterpriseBrief> {
  const entreprise = await findLeadById(client, "entreprise", match.entreprise_id);
  const profile = (entreprise?.profile ?? {}) as Record<string, unknown>;
  const delivery = [
    profile.delivery,
    profile.demande,
    profile.opportunity,
    profile.display,
    profile.form,
  ].find((value): value is Record<string, unknown> => typeof value === "object" && value !== null) ?? {};

  return {
    matchId: match.id,
    status: mapBriefStatus(match.status),
    secteur: readStringField(delivery, "secteur"),
    prestation: readStringField(delivery, "prestation"),
    budget: readStringField(delivery, "budget"),
    companyLabel: entreprise?.company?.trim() || undefined,
    verso: buildVersoFields(delivery),
  };
}

function pickActiveMatch(matches: MatchRow[]): MatchRow | null {
  return (
    matches.find((match) => match.status === "booked") ??
    matches.find((match) => match.status === "proposed") ??
    null
  );
}

export async function loadDeliveryContext(
  client: SupabaseClient,
  agenceId: string,
  isPaid: boolean,
): Promise<{
  deliveryPlan: DashboardDeliveryPlan | null;
  enterpriseBrief: DashboardEnterpriseBrief | null;
}> {
  if (!isPaid) {
    return { deliveryPlan: null, enterpriseBrief: null };
  }

  const { data: depositPayment, error: depositPaymentError } = await client
    .from("payments")
    .select("offer_type")
    .eq("agence_id", agenceId)
    .eq("status", "succeeded")
    .in("payment_phase", ["deposit", "full"])
    .order("succeeded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (depositPaymentError) {
    throw new Error(`payments lookup failed: ${depositPaymentError.message}`);
  }

  const { data: payment, error: paymentError } = depositPayment
    ? { data: depositPayment, error: null }
    : await client
        .from("payments")
        .select("offer_type")
        .eq("agence_id", agenceId)
        .eq("status", "succeeded")
        .order("succeeded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

  if (paymentError) {
    throw new Error(`payments lookup failed: ${paymentError.message}`);
  }

  const { data: matchRows, error: matchError } = await client
    .from("matches")
    .select("*")
    .eq("agence_id", agenceId)
    .order("created_at", { ascending: false });

  if (matchError) {
    throw new Error(`matches lookup failed: ${matchError.message}`);
  }

  const matches = (matchRows ?? []).map((row) =>
    mapMatchRow(row as Record<string, unknown>),
  );
  const deliveryPlan = buildDeliveryPlan(
    (payment?.offer_type as string | null) ?? OFFER_TYPES.starter998_5,
    matches,
  );

  const activeMatch = pickActiveMatch(matches);
  const enterpriseBrief =
    activeMatch && ACTIVE_BRIEF_STATUSES.has(activeMatch.status)
      ? await buildEnterpriseBrief(client, activeMatch)
      : null;

  return { deliveryPlan, enterpriseBrief };
}
