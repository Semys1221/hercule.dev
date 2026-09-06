import { NextResponse } from "next/server";
import { z } from "zod";

import { renderBookingEmailPreview } from "@/lib/booking-communication/render-service";
import { BOOKING_EMAIL_TYPE_VALUES } from "@/lib/booking-communication/types";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import type { LeadCategory } from "@/lib/link-tracking/types";

const bodySchema = z.object({
  category: z.enum(["agence", "entreprise"]),
  emailType: z.enum(BOOKING_EMAIL_TYPE_VALUES),
  subject: z.string(),
  body: z.string(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const rendered = await renderBookingEmailPreview({
      category: parsed.data.category as LeadCategory,
      emailType: parsed.data.emailType as BookingEmailType,
      subject: parsed.data.subject,
      body: parsed.data.body,
      sample: true,
    });
    return NextResponse.json({
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preview failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
