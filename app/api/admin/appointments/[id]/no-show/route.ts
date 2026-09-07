import { NextResponse } from "next/server";
import { z } from "zod";

import { COMMERCIAL } from "@/lib/commercial/constants";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import { transitionFromNoshowToInDeliverance } from "@/lib/product/transitions";

const bodySchema = z.object({
  reporter: z.enum(["agence", "entreprise"]),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/admin/appointments/[id]/no-show
 *
 * Reports a no-show for a delivery appointment:
 * - Sets appointments.status = 'no_show_entreprise' | 'no_show_agence'
 * - If entreprise no-show: credits_remaining + 1 (via transitionFromNoshowToInDeliverance)
 * - Transitions agence back to IN_DELIVERANCE
 * - Clears active_match_id
 *
 * Body: { reporter: 'agence' | 'entreprise' }
 */
export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "reporter must be 'agence' or 'entreprise'" }, { status: 400 });
  }

  const { reporter } = parsed.data;

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
    const newStatus =
      reporter === "entreprise" ? "no_show_entreprise" : "no_show_agence";

    // Mark appointment with no-show status
    const { error: updateError } = await client
      .from("appointments")
      .update({
        status: newStatus,
        noshow_reported_at: now,
        noshow_reported_by: reporter,
      })
      .eq("id", id);

    if (updateError) {
      throw new Error(`appointments update: ${updateError.message}`);
    }

    // Fetch agence offer_type for credit calculation
    const { data: agenceRow } = await client
      .from("agence")
      .select("offer_type")
      .eq("id", appt.agence_id)
      .maybeSingle();

    const offerType = agenceRow?.offer_type ?? null;

    if (reporter === "entreprise") {
      // No-show entreprise: agence gets credit back, both return to search
      await transitionFromNoshowToInDeliverance(
        client,
        appt.agence_id,
        appt.entreprise_id,
        offerType,
      );

      // Close the match record (entreprise no-showed → back to proposed so agence can rematch)
      const { data: match } = await client
        .from("matches")
        .select("id")
        .eq("id", appt.match_id)
        .maybeSingle();

      if (match) {
        // Reset match to proposed so agence can be rematched
        await client
          .from("matches")
          .update({ status: "proposed" })
          .eq("id", match.id);
      }

      // Schedule a replacement follow-up in N working days (defined by COMMERCIAL)
      const replacementDays = COMMERCIAL.noshowReplaceWorkingDays;
      const replacementDate = new Date(
        Date.now() + replacementDays * 24 * 60 * 60 * 1000,
      );

      // Log for ops visibility — actual replacement search is manual
      console.log(
        `[appointments/no-show] entreprise no-show: agence=${appt.agence_id} replacement expected by=${replacementDate.toISOString()}`,
      );
    } else {
      // No-show agence: return agence to IN_DELIVERANCE, keep entreprise in current state
      await client
        .from("agence")
        .update({
          product_statut: "IN_DELIVERANCE",
          active_match_id: null,
        })
        .eq("id", appt.agence_id)
        .throwOnError();
    }

    return NextResponse.json({
      ok: true,
      appointmentId: id,
      status: newStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "appointment no-show failed";
    console.error("[appointments/no-show]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
