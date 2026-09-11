import { NextResponse } from "next/server";
import { z } from "zod";

import { provisionTestMeeting } from "@/lib/admin/funnels/provision-test-meeting";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";

const postSchema = z.object({
  audience: z.enum(["agence", "comptable", "cif"]).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
  }

  const audience = parsed.data.audience ?? "agence";

  try {
    const client = createLinkTrackingClient();
    const result = await provisionTestMeeting(client, audience);
    return NextResponse.json({
      ok: true,
      booking: result.booking,
      qualification: result.qualification,
      closing: result.closing,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "test meeting provision failed";
    console.error("[admin/sales-funnel/test-meeting]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
