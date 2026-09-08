import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createSalesCallsClient,
  findSalesCallByInviteeUri,
  replaceSalesCallNotesSection,
  upsertSalesCallFromBooking,
} from "@/lib/sales-calls/supabase";

const postSchema = z
  .object({
    agenceId: z.string().uuid().nullable().optional(),
    entrepriseId: z.string().uuid().nullable().optional(),
    email: z.string().email(),
    inviteeUri: z.string().min(1),
    scheduledAt: z.string().datetime().nullable().optional(),
  })
  .refine(
    (data) => Boolean(data.agenceId) || Boolean(data.entrepriseId),
    { message: "agenceId or entrepriseId is required" },
  );

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const client = createSalesCallsClient();
    const salesCall = await upsertSalesCallFromBooking(client, {
      agenceId: parsed.data.agenceId ?? null,
      entrepriseId: parsed.data.entrepriseId ?? null,
      email: parsed.data.email,
      inviteeUri: parsed.data.inviteeUri,
      scheduledAt: parsed.data.scheduledAt ?? null,
    });

    return NextResponse.json({ salesCall });
  } catch (error) {
    const message = error instanceof Error ? error.message : "sales_calls upsert failed";
    console.error("[admin/sales-calls]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const inviteeUri = searchParams.get("inviteeUri")?.trim();
  if (!inviteeUri) {
    return NextResponse.json({ error: "inviteeUri is required" }, { status: 400 });
  }

  try {
    const client = createSalesCallsClient();
    const salesCall = await findSalesCallByInviteeUri(client, inviteeUri);
    if (!salesCall) {
      return NextResponse.json({ error: "Sales call not found" }, { status: 404 });
    }
    return NextResponse.json({ salesCall });
  } catch (error) {
    const message = error instanceof Error ? error.message : "sales_calls fetch failed";
    console.error("[admin/sales-calls]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
