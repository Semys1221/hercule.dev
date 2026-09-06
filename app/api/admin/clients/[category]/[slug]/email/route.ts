import { NextResponse } from "next/server";

import { isAudience } from "@/lib/admin/navigation";
import { sendProductEmailNow } from "@/lib/booking-communication/product-send";
import {
  BOOKING_EMAIL_TYPE_VALUES,
  type BookingEmailType,
} from "@/lib/booking-communication/types";
import {
  createLinkTrackingClient,
  findLeadByLink,
} from "@/lib/link-tracking/supabase";

type RouteParams = {
  params: Promise<{ category: string; slug: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { category, slug } = await params;
  if (!isAudience(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  let body: { emailType?: unknown };
  try {
    body = (await request.json()) as { emailType?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body.emailType !== "string" ||
    !(BOOKING_EMAIL_TYPE_VALUES as readonly string[]).includes(body.emailType)
  ) {
    return NextResponse.json({ error: "Invalid emailType" }, { status: 400 });
  }

  const emailType = body.emailType as BookingEmailType;

  try {
    const client = createLinkTrackingClient();
    const lookup = await findLeadByLink(client, slug.trim());
    if (!lookup || lookup.category !== category) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const result = await sendProductEmailNow({
      category,
      leadId: lookup.lead.id,
      emailType,
      triggeredBy: "deliverance_admin",
      idempotencyKey: `admin-cockpit:${lookup.lead.id}:${emailType}:${Date.now()}`,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "send failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "email send failed";
    console.error("[admin/clients/email]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
