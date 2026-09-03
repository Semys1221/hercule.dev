import { NextResponse } from "next/server";

import { sendBookingEmail } from "@/lib/booking-communication/send";
import { previewTemplate } from "@/lib/booking-communication/template-store";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import type { LeadCategory } from "@/lib/link-tracking/types";

const DEFAULT_TEST_TO = "nanguy29@gmail.com";

function verifySecret(request: Request): boolean {
  const expected =
    process.env.LINK_TRACKING_WEBHOOK_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim();
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

function isCategory(value: unknown): value is LeadCategory {
  return value === "agence" || value === "entreprise";
}

function isEmailType(value: unknown): value is BookingEmailType {
  return (
    value === "immediate" ||
    value === "h48_confirm" ||
    value === "h24_relance" ||
    value === "h20_cancel" ||
    value === "role_seq_48" ||
    value === "role_seq_24"
  );
}

export async function POST(request: Request) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    category?: string;
    email_type?: string;
    subject?: string;
    body?: string;
    to?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !isCategory(body.category) ||
    !isEmailType(body.email_type) ||
    !body.subject?.trim() ||
    !body.body?.trim()
  ) {
    return NextResponse.json(
      { error: "category, email_type, subject, body required" },
      { status: 400 },
    );
  }

  const to = body.to?.trim() || DEFAULT_TEST_TO;
  if (!to.includes("@")) {
    return NextResponse.json({ error: "invalid to address" }, { status: 400 });
  }

  const rendered = await previewTemplate(
    body.subject.trim(),
    body.body,
    body.email_type,
  );

  const idempotencyKey = `test:${body.category}:${body.email_type}:${Date.now()}`;
  const result = await sendBookingEmail({
    to,
    subject: `[TEST ${body.category}] ${rendered.subject}`,
    text: rendered.text,
    html: rendered.html,
    idempotencyKey,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    to,
    resend_email_id: result.id,
    subject: rendered.subject,
  });
}
