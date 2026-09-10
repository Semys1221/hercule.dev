import { NextResponse } from "next/server";

import {
  bookFromInbound,
  type BookFromInboundMode,
} from "@/lib/calendly/book-from-inbound";
import { parseBookingEvent } from "@/lib/calendly/availability";

type BookFromInboundBody = {
  event?: string;
  leadEmail?: string;
  leadName?: string;
  inboundText?: string;
  mode?: BookFromInboundMode;
};

function parseMode(value: string | undefined): BookFromInboundMode {
  if (value === "try_book" || value === "suggest_slots" || value === "none") {
    return value;
  }
  return "none";
}

export async function POST(request: Request) {
  let body: BookFromInboundBody;
  try {
    body = (await request.json()) as BookFromInboundBody;
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  const event = parseBookingEvent(body.event);
  const leadEmail = body.leadEmail?.trim().toLowerCase() ?? "";
  const leadName = body.leadName?.trim() ?? leadEmail;
  const inboundText = body.inboundText?.trim() ?? "";
  const mode = parseMode(body.mode);

  if (!event || !leadEmail || !inboundText) {
    return NextResponse.json(
      { ok: false, reason: "missing_fields" },
      { status: 400 },
    );
  }

  try {
    const result = await bookFromInbound({
      event,
      leadEmail,
      leadName,
      inboundText,
      mode,
    });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[calendly/book-from-inbound]", message);
    return NextResponse.json({ ok: false, reason: message }, { status: 502 });
  }
}
