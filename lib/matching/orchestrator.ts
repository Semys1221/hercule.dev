import { randomUUID } from "crypto";

import { getCalendlyBaseUrl } from "@/lib/env";
import { cancelPendingJobsForLead } from "@/lib/booking-communication/jobs";
import {
  scheduleLeadEmailJobs,
  sendProductEmailNow,
} from "@/lib/booking-communication/product-send";
import { formatLeadInfo } from "@/lib/booking-communication/product-vars";
import { createLinkTrackingClient, findLeadById } from "@/lib/link-tracking/supabase";

import {
  findMatchById,
  insertMatch,
  listEndedBookedMatches,
  updateMatch,
  type MatchRow,
} from "./store";

export function matchCalendlyUrl(baseUrl: string, matchId: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set("utm_content", `match:${matchId}`);
  return url.toString();
}

export function parseMatchIdFromUtm(utmContent: string): string | null {
  const trimmed = utmContent.trim();
  if (!trimmed.startsWith("match:")) return null;
  const id = trimmed.slice("match:".length).trim();
  return id || null;
}

function calendlyUrlForAgence(profile: Record<string, unknown> | null): string {
  const form = (profile?.form ?? {}) as Record<string, unknown>;
  const dashboard = (profile?.dashboard ?? {}) as Record<string, unknown>;
  const raw =
    (typeof form.calendlyUrl === "string" && form.calendlyUrl) ||
    (typeof dashboard.calendlyUrl === "string" && dashboard.calendlyUrl) ||
    getCalendlyBaseUrl();
  return raw;
}

export async function createMatchAndPropose(params: {
  agenceId: string;
  entrepriseId: string;
}): Promise<MatchRow> {
  const client = createLinkTrackingClient();
  const agence = await findLeadById(client, "agence", params.agenceId);
  const entreprise = await findLeadById(client, "entreprise", params.entrepriseId);
  if (!agence || !entreprise) {
    throw new Error("lead_not_found");
  }

  const placeholderId = randomUUID();
  const calendlyUrl = matchCalendlyUrl(calendlyUrlForAgence(agence.profile), placeholderId);
  const match = await insertMatch({
    agenceId: params.agenceId,
    entrepriseId: params.entrepriseId,
    calendlyUrl,
  });

  const finalUrl = matchCalendlyUrl(calendlyUrlForAgence(agence.profile), match.id);
  const updated =
    finalUrl !== calendlyUrl
      ? await updateMatch(match.id, { calendly_url: finalUrl })
      : match;

  const extra = {
    agenceInfo: formatLeadInfo(agence),
    entrepriseInfo: formatLeadInfo(entreprise),
    calendlyLink: updated.calendly_url ?? finalUrl,
  };

  await sendProductEmailNow({
    category: "entreprise",
    leadId: entreprise.id,
    emailType: "match_proposal",
    triggeredBy: "admin_match",
    idempotencyKey: `match:proposal:${updated.id}`,
    extra,
  });

  await scheduleLeadEmailJobs({
    category: "entreprise",
    leadId: entreprise.id,
    triggeredBy: "admin_match",
    jobs: [
      {
        emailType: "match_proposal_followup",
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
        idempotencyKey: `match:followup:${updated.id}`,
      },
    ],
  });

  try {
    await client
      .from("entreprise")
      .update({ product_statut: "MATCH_PROPOSED" })
      .eq("id", entreprise.id);
  } catch (error) {
    console.error(
      "[matching] entreprise product_statut update failed:",
      error instanceof Error ? error.message : error,
    );
  }

  return updated;
}

export async function handleMatchBooking(params: {
  matchId: string;
  scheduledAt: string;
  calendlyInviteeUri?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const match = await findMatchById(params.matchId);
  if (!match) return { ok: false, reason: "match_not_found" };

  const updated = await updateMatch(match.id, {
    status: "booked",
    booking_at: params.scheduledAt,
  });

  const client = createLinkTrackingClient();
  const agence = await findLeadById(client, "agence", updated.agence_id);
  const entreprise = await findLeadById(client, "entreprise", updated.entreprise_id);
  if (!agence || !entreprise) {
    return { ok: false, reason: "lead_not_found" };
  }

  // INSERT appointments row (idempotent via calendly_invitee_uri UNIQUE)
  const { data: appointmentRow } = await client
    .from("appointments")
    .upsert(
      {
        match_id: updated.id,
        agence_id: updated.agence_id,
        entreprise_id: updated.entreprise_id,
        kind: "delivery",
        calendly_invitee_uri: params.calendlyInviteeUri ?? null,
        scheduled_at: params.scheduledAt,
        status: "scheduled",
      },
      { onConflict: "calendly_invitee_uri", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();

  // Set active_match_id on agence; decrement credits if pack_989x3
  const agenceProfile = agence.profile as Record<string, unknown> | null;
  const offerType = (agenceProfile?.offer_type as string | undefined) ?? null;

  const agencePatch: Record<string, unknown> = {
    active_match_id: updated.id,
    product_statut: "MEETING_BOOKED",
  };
  if (offerType === "pack_989x3") {
    const { data: agRow } = await client
      .from("agence")
      .select("credits_remaining")
      .eq("id", agence.id)
      .maybeSingle();
    if (typeof agRow?.credits_remaining === "number" && agRow.credits_remaining > 0) {
      agencePatch.credits_remaining = agRow.credits_remaining - 1;
    }
  }

  await client.from("agence").update(agencePatch).eq("id", agence.id);

  await cancelPendingJobsForLead(entreprise.id, ["match_proposal_followup"]);

  await sendProductEmailNow({
    category: "agence",
    leadId: agence.id,
    emailType: "match_booking_agence",
    triggeredBy: "calendly_match_booking",
    idempotencyKey: `match:booking:${updated.id}`,
    extra: {
      agenceInfo: formatLeadInfo(agence),
      entrepriseInfo: formatLeadInfo(entreprise),
      calendlyLink: updated.calendly_url ?? "",
      scheduledAt: params.scheduledAt,
    },
  });

  try {
    await client
      .from("entreprise")
      .update({ product_statut: "MEETING_BOOKED" })
      .eq("id", entreprise.id);
  } catch (error) {
    console.error(
      "[matching] entreprise product_statut update failed:",
      error instanceof Error ? error.message : error,
    );
  }

  console.log(
    `[matching] handleMatchBooking ok: match=${updated.id} appointment=${appointmentRow?.id ?? "upserted"}`,
  );

  return { ok: true };
}

export async function sendPostRdvSurveys(): Promise<{ sent: number }> {
  const ended = await listEndedBookedMatches();
  let sent = 0;

  for (const match of ended) {
    const agenceToken = randomUUID();
    const entrepriseToken = randomUUID();
    await updateMatch(match.id, {
      surveys_sent_at: new Date().toISOString(),
      agence_survey_token: agenceToken,
      entreprise_survey_token: entrepriseToken,
    });

    const surveyBase =
      process.env.SURVEY_BASE_URL?.trim().replace(/\/$/, "") ||
      "https://www.hercule.dev/survey";

    await sendProductEmailNow({
      category: "agence",
      leadId: match.agence_id,
      emailType: "survey_rdv_agence",
      triggeredBy: "cron_rdv_survey",
      idempotencyKey: `survey:agence:${match.id}`,
      extra: { surveyLink: `${surveyBase}/${agenceToken}` },
    });
    await sendProductEmailNow({
      category: "entreprise",
      leadId: match.entreprise_id,
      emailType: "survey_rdv_entreprise",
      triggeredBy: "cron_rdv_survey",
      idempotencyKey: `survey:entreprise:${match.id}`,
      extra: { surveyLink: `${surveyBase}/${entrepriseToken}` },
    });

    const followupAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await scheduleLeadEmailJobs({
      category: "agence",
      leadId: match.agence_id,
      triggeredBy: "cron_rdv_survey",
      jobs: [
        {
          emailType: "survey_rdv_agence_followup",
          scheduledFor: followupAt,
          idempotencyKey: `survey:agence:followup:${match.id}`,
        },
      ],
    });
    await scheduleLeadEmailJobs({
      category: "entreprise",
      leadId: match.entreprise_id,
      triggeredBy: "cron_rdv_survey",
      jobs: [
        {
          emailType: "survey_rdv_entreprise_followup",
          scheduledFor: followupAt,
          idempotencyKey: `survey:entreprise:followup:${match.id}`,
        },
      ],
    });

    sent += 1;
  }

  return { sent };
}

export async function submitSurvey(params: {
  token: string;
  saleMade?: boolean;
}): Promise<{ ok: boolean; audience: "agence" | "entreprise" }> {
  const { findMatchBySurveyToken } = await import("./store");
  const match = await findMatchBySurveyToken(params.token);
  if (!match) {
    throw new Error("survey_not_found");
  }

  const isAgence = match.agence_survey_token === params.token;
  const now = new Date().toISOString();

  if (isAgence) {
    await updateMatch(match.id, {
      agence_survey_responded_at: now,
      sale_made: params.saleMade ?? match.sale_made,
      ...(params.saleMade ? { status: "sold" } : {}),
    });
    await cancelPendingJobsForLead(match.agence_id, ["survey_rdv_agence_followup"]);
    if (params.saleMade) {
      await scheduleLeadEmailJobs({
        category: "entreprise",
        leadId: match.entreprise_id,
        triggeredBy: "cron_sold_check",
        jobs: [
          {
            emailType: "sold_check_j7",
            scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            idempotencyKey: `sold-check:${match.id}`,
          },
        ],
      });
    }
    return { ok: true, audience: "agence" };
  }

  await updateMatch(match.id, { entreprise_survey_responded_at: now });
  await cancelPendingJobsForLead(match.entreprise_id, ["survey_rdv_entreprise_followup"]);
  return { ok: true, audience: "entreprise" };
}
