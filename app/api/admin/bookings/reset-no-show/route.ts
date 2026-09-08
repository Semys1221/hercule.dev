import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveBookingLead } from "@/lib/admin/bookings/resolve-booking-lead";
import { revalidateBookingsCache } from "@/lib/calendly/bookings-cache";
import { resetNoShowForLead } from "@/lib/no-show-sequence/reset";
import {
  createSalesCallsClient,
  upsertSalesCallFromBooking,
} from "@/lib/sales-calls/supabase";

const bodySchema = z.object({
  inviteeUri: z.string().min(1),
  leadId: z.string().uuid().nullable().optional(),
  email: z.string().email(),
  startTime: z.string().min(1).nullable().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const lead = await resolveBookingLead({
      leadId: parsed.data.leadId,
      email: parsed.data.email,
      inviteeUri: parsed.data.inviteeUri,
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
    }

    const client = createSalesCallsClient();
    const salesCall = await upsertSalesCallFromBooking(client, {
      agenceId: lead.id,
      email: parsed.data.email,
      inviteeUri: parsed.data.inviteeUri,
      scheduledAt: parsed.data.startTime ?? null,
    });

    const result = await resetNoShowForLead(salesCall, lead.id);

    if (!result.ok) {
      const message =
        result.reason === "paid"
          ? "Impossible de réinitialiser un lead payé"
          : "Le statut actuel n'est pas no-show";
      return NextResponse.json({ error: message, reason: result.reason }, { status: 409 });
    }

    revalidateBookingsCache();

    return NextResponse.json({
      status: result.status,
      cancelledJobs: result.cancelledJobs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "reset no-show failed";
    console.error("[admin/bookings/reset-no-show]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
