import { NextResponse } from "next/server";

import {
  formatInternational1to1BookingContextForGrok,
  resolveInternational1to1BookingContext,
} from "@/lib/legacy/calendly/international-1to1-booking";

type International1to1LinkBody = {
  leadEmail?: string;
  inboundText?: string;
  threadContext?: string;
};

export async function POST(request: Request) {
  let body: International1to1LinkBody;
  try {
    body = (await request.json()) as International1to1LinkBody;
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  const leadEmail = body.leadEmail?.trim().toLowerCase() ?? "";
  const inboundText = body.inboundText?.trim() ?? "";
  const threadContext = body.threadContext?.trim() ?? "";

  if (!leadEmail || !inboundText) {
    return NextResponse.json(
      { ok: false, reason: "missing_fields" },
      { status: 400 },
    );
  }

  try {
    const result = await resolveInternational1to1BookingContext({
      leadEmail,
      inboundText,
      threadContext,
    });
    if (result.status !== "ready") {
      return NextResponse.json({ ok: true, result });
    }
    return NextResponse.json({
      ok: true,
      result,
      bookingContext: formatInternational1to1BookingContextForGrok(result),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[calendly/international-1to1-link]", message);
    return NextResponse.json({ ok: false, reason: message }, { status: 502 });
  }
}
