import { NextResponse } from "next/server";

import {
  getBookingEmailTemplates,
  upsertBookingEmailTemplates,
} from "@/lib/booking-communication/template-store";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import type { LeadCategory } from "@/lib/link-tracking/types";

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
    value === "h20_cancel"
  );
}

export async function GET(request: Request) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  if (!isCategory(category)) {
    return NextResponse.json(
      { error: "category must be agence or entreprise" },
      { status: 400 },
    );
  }

  const templates = await getBookingEmailTemplates(category);
  return NextResponse.json({ category, templates });
}

export async function PUT(request: Request) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    category?: string;
    templates?: Array<{ email_type?: string; subject?: string; body?: string }>;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isCategory(body.category) || !Array.isArray(body.templates)) {
    return NextResponse.json(
      { error: "category and templates required" },
      { status: 400 },
    );
  }

  const parsed: Array<{
    email_type: BookingEmailType;
    subject: string;
    body: string;
  }> = [];

  for (const template of body.templates) {
    if (
      !isEmailType(template.email_type) ||
      !template.subject?.trim() ||
      !template.body?.trim()
    ) {
      return NextResponse.json(
        { error: "each template needs email_type, subject, body" },
        { status: 400 },
      );
    }
    parsed.push({
      email_type: template.email_type,
      subject: template.subject.trim(),
      body: template.body,
    });
  }

  try {
    await upsertBookingEmailTemplates(body.category, parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const templates = await getBookingEmailTemplates(body.category);
  return NextResponse.json({ ok: true, category: body.category, templates });
}
