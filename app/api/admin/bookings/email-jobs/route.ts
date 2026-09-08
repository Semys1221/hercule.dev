import { NextResponse } from "next/server";
import { z } from "zod";

import { listBookingEmailJobsByLeadIds } from "@/lib/admin/bookings/email-jobs";

const querySchema = z.object({
  leadIds: z.string().min(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    leadIds: searchParams.get("leadIds") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "leadIds query parameter required" }, { status: 400 });
  }

  const leadIds = parsed.data.leadIds
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (leadIds.length === 0) {
    return NextResponse.json({ jobsByLeadId: {} });
  }

  if (leadIds.length > 200) {
    return NextResponse.json({ error: "Too many leadIds (max 200)" }, { status: 400 });
  }

  try {
    const jobsByLeadId = await listBookingEmailJobsByLeadIds(leadIds);
    return NextResponse.json({ jobsByLeadId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load email jobs";
    console.error("[admin/bookings/email-jobs]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
