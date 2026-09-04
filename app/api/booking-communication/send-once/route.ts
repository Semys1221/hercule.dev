import { NextResponse } from "next/server";

import {
  isBookingEmailType,
  verifyBookingCommunicationSecret,
} from "@/lib/booking-communication/route-utils";
import { sendBookingEmailOnce } from "@/lib/booking-communication/render-service";
import type { LeadCategory } from "@/lib/link-tracking/types";

function isCategory(value: unknown): value is LeadCategory {
  return value === "agence" || value === "entreprise";
}

export async function POST(request: Request) {
  if (!verifyBookingCommunicationSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    lead_id?: string;
    category?: string;
    email_type?: string;
    subject?: string;
    body?: string;
    use_html?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.lead_id?.trim() || !isCategory(body.category) || !isBookingEmailType(body.email_type)) {
    return NextResponse.json(
      { error: "lead_id, category, email_type required" },
      { status: 400 },
    );
  }

  try {
    const result = await sendBookingEmailOnce({
      category: body.category,
      leadId: body.lead_id.trim(),
      emailType: body.email_type,
      subject: body.subject,
      body: body.body,
      useHtml: body.use_html,
    });
    return NextResponse.json({
      ok: true,
      resend_email_id: result.resendEmailId,
      subject: result.subject,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message === "lead_not_found" ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
