import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import { sendProductEmailNow } from "@/lib/booking-communication/product-send";
import { transitionToPostRdvSurvey } from "@/lib/product/transitions";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/admin/appointments/[id]/complete
 *
 * Marks a delivery appointment as completed:
 * - Sets appointments.status = 'completed', completed_at = now()
 * - Generates survey_token_agence + survey_token_entreprise
 * - Transitions agence to POST_RDV_SURVEY
 * - Sends survey emails to both parties
 */
export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const client = createLinkTrackingClient();

    // Fetch the appointment
    const { data: appt, error: apptError } = await client
      .from("appointments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (apptError || !appt) {
      return NextResponse.json({ error: "appointment_not_found" }, { status: 404 });
    }

    if (appt.status !== "scheduled") {
      return NextResponse.json(
        { error: `appointment_already_${appt.status}` },
        { status: 422 },
      );
    }

    const now = new Date().toISOString();
    const surveyTokenAgence = randomUUID();
    const surveyTokenEntreprise = randomUUID();

    // Mark appointment completed and write survey tokens
    const { error: updateError } = await client
      .from("appointments")
      .update({
        status: "completed",
        completed_at: now,
        survey_token_agence: surveyTokenAgence,
        survey_token_entreprise: surveyTokenEntreprise,
      })
      .eq("id", id);

    if (updateError) {
      throw new Error(`appointments update: ${updateError.message}`);
    }

    // Transition agence to POST_RDV_SURVEY
    try {
      await transitionToPostRdvSurvey(client, appt.agence_id);
    } catch (err) {
      console.error(
        "[appointments/complete] transitionToPostRdvSurvey:",
        err instanceof Error ? err.message : err,
      );
    }

    // Send survey emails
    const surveyBase =
      process.env.SURVEY_BASE_URL?.trim().replace(/\/$/, "") || "https://www.hercule.dev/survey";

    await sendProductEmailNow({
      category: "agence",
      leadId: appt.agence_id,
      emailType: "survey_rdv_agence",
      triggeredBy: "admin_complete_appt",
      idempotencyKey: `survey:agence:appt:${id}`,
      extra: { surveyLink: `${surveyBase}/${surveyTokenAgence}` },
    });

    await sendProductEmailNow({
      category: "entreprise",
      leadId: appt.entreprise_id,
      emailType: "survey_rdv_entreprise",
      triggeredBy: "admin_complete_appt",
      idempotencyKey: `survey:entreprise:appt:${id}`,
      extra: { surveyLink: `${surveyBase}/${surveyTokenEntreprise}` },
    });

    return NextResponse.json({
      ok: true,
      appointmentId: id,
      surveyTokenAgence,
      surveyTokenEntreprise,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "appointment complete failed";
    console.error("[appointments/complete]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
