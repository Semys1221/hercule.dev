import { NextResponse } from "next/server";
import { z } from "zod";

import { fixUntrackedBooking } from "@/lib/legacy/admin/bookings/fix-untracked-booking";
import { revalidateBookingsCache } from "@/lib/legacy/calendly/bookings-cache";
import { buildDisplayLinks } from "@/lib/legacy/calendly/enrich-bookings";
import type { CalendlyBookingRow } from "@/lib/legacy/calendly/list-bookings";
import { ALL_LEAD_CATEGORIES } from "@/lib/legacy/link-tracking/types";

const bodySchema = z.object({
  inviteeUri: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  startTime: z.string().min(1),
  eventUri: z.string().nullable().optional(),
  bookingCategory: z.enum(ALL_LEAD_CATEGORIES),
  slug: z.string().nullable().optional(),
  questions: z.record(z.string()).optional(),
  calendlyJoinUrl: z.string().nullable().optional(),
  calendlyRescheduleUrl: z.string().nullable().optional(),
  calendlyCancelUrl: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const result = await fixUntrackedBooking({
      email: parsed.data.email,
      firstName: parsed.data.firstName,
      company: parsed.data.company,
      startTime: parsed.data.startTime,
      inviteeUri: parsed.data.inviteeUri,
      eventUri: parsed.data.eventUri,
      bookingCategory: parsed.data.bookingCategory,
      slug: parsed.data.slug,
      questions: parsed.data.questions,
      calendlyJoinUrl: parsed.data.calendlyJoinUrl,
      calendlyRescheduleUrl: parsed.data.calendlyRescheduleUrl,
      calendlyCancelUrl: parsed.data.calendlyCancelUrl,
    });

    if (!result.ok) {
      const status =
        result.reason === "category_collision" || result.reason === "entreprise_email_collision"
          ? 409
          : 422;
      return NextResponse.json(
        {
          ok: false,
          reason: result.reason,
          error: result.errorMessage ?? "Alignement impossible",
        },
        { status },
      );
    }

    revalidateBookingsCache();

    const bookingRow: CalendlyBookingRow = {
      email: parsed.data.email,
      name: parsed.data.firstName ?? parsed.data.email,
      first_name: parsed.data.firstName ?? "",
      company: parsed.data.company ?? null,
      start_time: parsed.data.startTime,
      invitee_uri: parsed.data.inviteeUri,
      event_uri: parsed.data.eventUri ?? "",
      questions: parsed.data.questions ?? {},
      slug: result.lookup.lead.slug,
      lead_id: result.lookup.lead.id,
      lead_category: result.lookup.category,
      booking_category: parsed.data.bookingCategory,
      calendly_join_url: parsed.data.calendlyJoinUrl ?? null,
      calendly_reschedule_url: parsed.data.calendlyRescheduleUrl ?? null,
      calendly_cancel_url: parsed.data.calendlyCancelUrl ?? null,
    };

    const links = buildDisplayLinks(bookingRow, result.lookup.lead);

    return NextResponse.json({
      ok: true,
      created: result.created,
      leadId: result.lookup.lead.id,
      leadCategory: result.lookup.category,
      slug: result.lookup.lead.slug,
      statut: result.lookup.lead.statut,
      links,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "fix untracked failed";
    console.error("[admin/bookings/fix-untracked]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
