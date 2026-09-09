import { NextResponse } from "next/server";
import { z } from "zod";

import {
  BOOKING_CONFIRMATION_DISABLED,
  bookingConfirmationDisabledResponse,
} from "@/lib/booking-communication/confirmation-disabled";
import { resolveBookingLead } from "@/lib/admin/bookings/resolve-booking-lead";
import { startSequenceForBookedLead } from "@/lib/booking-communication/route-sequence";
import { revalidateBookingsCache } from "@/lib/calendly/bookings-cache";

const bodySchema = z.object({
  inviteeUri: z.string().min(1),
  leadId: z.string().uuid().nullable().optional(),
  email: z.string().email(),
  startTime: z.string().min(1).nullable().optional(),
});

export async function POST(request: Request) {
  if (BOOKING_CONFIRMATION_DISABLED) {
    return NextResponse.json(bookingConfirmationDisabledResponse(), { status: 409 });
  }

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
    const resolved = await resolveBookingLead({
      leadId: parsed.data.leadId,
      email: parsed.data.email,
      inviteeUri: parsed.data.inviteeUri,
    });

    if (!resolved) {
      return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
    }

    const sequence = await startSequenceForBookedLead({
      category: resolved.category,
      lead: resolved.lead,
      triggeredBy: "manual",
    });

    if (!sequence.started) {
      return NextResponse.json(
        {
          started: false,
          reason: sequence.reason ?? "sequence_not_started",
        },
        { status: 422 },
      );
    }

    revalidateBookingsCache();

    return NextResponse.json({
      started: true,
      reason: sequence.reason,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "start confirm sequence failed";
    console.error("[admin/bookings/start-confirm-sequence]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
