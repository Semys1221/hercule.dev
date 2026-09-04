import { NextResponse } from "next/server";

import {
  isBookingEmailType,
  verifyBookingCommunicationSecret,
} from "@/lib/booking-communication/route-utils";
import { renderBookingEmailPreview } from "@/lib/booking-communication/render-service";
import type { LeadCategory } from "@/lib/link-tracking/types";

function isCategory(value: unknown): value is LeadCategory {
  return value === "agence" || value === "entreprise";
}

export async function POST(request: Request) {
  if (!verifyBookingCommunicationSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    category?: string;
    email_type?: string;
    subject?: string;
    body?: string;
    lead_id?: string;
    use_html?: boolean;
    sample?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isCategory(body.category)) {
    return NextResponse.json(
      { error: "category must be agence or entreprise" },
      { status: 400 },
    );
  }

  if (body.email_type != null && !isBookingEmailType(body.email_type)) {
    return NextResponse.json({ error: "invalid email_type" }, { status: 400 });
  }

  try {
    const rendered = await renderBookingEmailPreview({
      category: body.category,
      emailType: body.email_type as Parameters<
        typeof renderBookingEmailPreview
      >[0]["emailType"],
      subject: body.subject,
      body: body.body,
      leadId: body.lead_id,
      useHtml: body.use_html,
      sample: body.sample === true,
    });
    return NextResponse.json(rendered);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message === "lead_not_found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
