import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveBookingLead } from "@/lib/admin/bookings/resolve-booking-lead";
import type { SalesCallSequenceResult } from "@/lib/admin/bookings/sales-call-sequence";
import { revalidateBookingsCache } from "@/lib/calendly/bookings-cache";
import {
  createSalesCallsClient,
  updateSalesCallStatus,
  upsertSalesCallFromBooking,
} from "@/lib/sales-calls/supabase";
import type { SalesCall, SalesCallStatus } from "@/lib/sales-calls/types";

const bodySchema = z.object({
  inviteeUri: z.string().min(1),
  leadId: z.string().uuid().nullable().optional(),
  email: z.string().email(),
  startTime: z.string().min(1).nullable().optional(),
  status: z.enum(["no_show", "not_paid"]),
});

async function startSequenceForStatus(
  salesCall: SalesCall,
  leadId: string,
  status: "no_show" | "not_paid",
): Promise<SalesCallSequenceResult> {
  if (status === "not_paid") {
    const { startCloseIndecisSequence } = await import(
      "@/lib/close-indecis-sequence/orchestrator"
    );
    return startCloseIndecisSequence(salesCall, leadId);
  }

  const { startNoShowSequence } = await import("@/lib/no-show-sequence/orchestrator");
  return startNoShowSequence(salesCall, leadId);
}

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
    const resolved = await resolveBookingLead({
      leadId: parsed.data.leadId,
      email: parsed.data.email,
      inviteeUri: parsed.data.inviteeUri,
    });

    if (!resolved) {
      return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
    }

    const client = createSalesCallsClient();
    let salesCall = await upsertSalesCallFromBooking(client, {
      agenceId: resolved.lead.id,
      email: parsed.data.email,
      inviteeUri: parsed.data.inviteeUri,
      scheduledAt: parsed.data.startTime ?? null,
    });

    if (salesCall.status === "paid") {
      return NextResponse.json({
        salesCallId: salesCall.id,
        status: "paid" satisfies SalesCallStatus,
        skipped: "already_paid",
      });
    }

    const statusChanged = salesCall.status !== parsed.data.status;
    if (statusChanged) {
      salesCall = await updateSalesCallStatus(client, salesCall.id, parsed.data.status);
    }

    const sequence = await startSequenceForStatus(
      salesCall,
      resolved.lead.id,
      parsed.data.status,
    );

    revalidateBookingsCache();

    if (statusChanged && !sequence.started) {
      return NextResponse.json(
        {
          salesCallId: salesCall.id,
          status: salesCall.status,
          sequence,
          error: "Séquence non démarrée",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      salesCallId: salesCall.id,
      status: salesCall.status,
      sequence,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "workflow action failed";
    console.error("[admin/bookings/workflow-action]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
