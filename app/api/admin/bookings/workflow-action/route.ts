import { NextResponse } from "next/server";
import { z } from "zod";

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

async function startSequenceForStatus(salesCall: SalesCall, status: "no_show" | "not_paid") {
  if (status === "not_paid") {
    const { startCloseIndecisSequence } = await import(
      "@/lib/close-indecis-sequence/orchestrator"
    );
    return startCloseIndecisSequence(salesCall);
  }

  const { startNoShowSequence } = await import("@/lib/no-show-sequence/orchestrator");
  return startNoShowSequence(salesCall);
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
    const client = createSalesCallsClient();
    let salesCall = await upsertSalesCallFromBooking(client, {
      agenceId: parsed.data.leadId ?? null,
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

    if (salesCall.status !== parsed.data.status) {
      salesCall = await updateSalesCallStatus(client, salesCall.id, parsed.data.status);
      await startSequenceForStatus(salesCall, parsed.data.status).catch((err: unknown) => {
        console.error(
          "[admin/bookings/workflow-action] sequence failed:",
          err instanceof Error ? err.message : err,
        );
      });
    }

    revalidateBookingsCache();

    return NextResponse.json({
      salesCallId: salesCall.id,
      status: salesCall.status,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "workflow action failed";
    console.error("[admin/bookings/workflow-action]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
