import { NextResponse } from "next/server";
import { z } from "zod";

import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import {
  transitionToSold,
  transitionToNoContinue,
  transitionToArchived,
} from "@/lib/product/transitions";
import { submitSurvey } from "@/lib/matching/orchestrator";
import { findMatchBySurveyToken } from "@/lib/matching/store";

type RouteParams = {
  params: Promise<{ token: string }>;
};

// ---------------------------------------------------------------------------
// GET — lookup survey by token (appointments table first, then matches fallback)
// ---------------------------------------------------------------------------

export async function GET(_request: Request, { params }: RouteParams) {
  const { token } = await params;
  try {
    const client = createLinkTrackingClient();

    // Check appointments table first (new flow)
    const { data: appt } = await client
      .from("appointments")
      .select("id, match_id, agence_id, entreprise_id, survey_token_agence, survey_token_entreprise, status")
      .or(`survey_token_agence.eq.${token},survey_token_entreprise.eq.${token}`)
      .maybeSingle();

    if (appt) {
      const audience = appt.survey_token_agence === token ? "agence" : "entreprise";
      return NextResponse.json({
        audience,
        matchId: appt.match_id,
        appointmentId: appt.id,
        source: "appointment",
      });
    }

    // Fallback: check matches table (legacy / cron-triggered flow)
    const match = await findMatchBySurveyToken(token);
    if (!match) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }
    const audience = match.agence_survey_token === token ? "agence" : "entreprise";
    return NextResponse.json({ audience, matchId: match.id, source: "match" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "survey lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — submit survey response
// ---------------------------------------------------------------------------

const postSchema = z.object({
  /**
   * Outcome of the survey:
   * - 'yes' (sale_made=true): deal closed → agence back to IN_DELIVERANCE
   * - 'no_continue' (sale_made=false): no deal but continue → agence back to IN_DELIVERANCE
   * - 'entreprise_refuse': entreprise refuses → entreprise ARCHIVED
   * - saleMade (bool, legacy): used by the old matches flow
   */
  outcome: z.enum(["yes", "no_continue", "entreprise_refuse"]).optional(),
  saleMade: z.boolean().optional(),
});

export async function POST(request: Request, { params }: RouteParams) {
  const { token } = await params;
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const client = createLinkTrackingClient();

    // Check appointments table first (new flow)
    const { data: appt } = await client
      .from("appointments")
      .select("id, match_id, agence_id, entreprise_id, survey_token_agence, survey_token_entreprise, status")
      .or(`survey_token_agence.eq.${token},survey_token_entreprise.eq.${token}`)
      .maybeSingle();

    if (appt) {
      const audience = appt.survey_token_agence === token ? "agence" : "entreprise";
      const outcome = parsed.data.outcome;
      const saleMade = parsed.data.saleMade;

      // Effective outcome
      const effectiveOutcome =
        outcome ?? (saleMade === true ? "yes" : saleMade === false ? "no_continue" : null);

      // Null out token to make it single-use
      const tokenField =
        audience === "agence" ? "survey_token_agence" : "survey_token_entreprise";
      await client
        .from("appointments")
        .update({ [tokenField]: null })
        .eq("id", appt.id);

      if (audience === "agence") {
        if (effectiveOutcome === "yes") {
          // Deal closed: agence back to IN_DELIVERANCE, match → sold
          await transitionToSold(client, appt.match_id, appt.agence_id);
        } else {
          // No deal but continue: agence back to IN_DELIVERANCE
          await transitionToNoContinue(client, appt.match_id, appt.agence_id);
        }
      } else {
        // Entreprise response
        if (effectiveOutcome === "entreprise_refuse") {
          await transitionToArchived(client, appt.entreprise_id);
        }
        // Otherwise no state change for entreprise
      }

      return NextResponse.json({ ok: true, audience, source: "appointment" });
    }

    // Fallback: matches table (legacy / cron-triggered flow)
    const result = await submitSurvey({
      token,
      saleMade: parsed.data.saleMade ?? (parsed.data.outcome === "yes"),
    });
    return NextResponse.json({ ...result, source: "match" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "survey submit failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
