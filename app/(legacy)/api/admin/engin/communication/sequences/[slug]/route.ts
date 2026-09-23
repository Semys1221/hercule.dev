import { NextResponse } from "next/server";
import { z } from "zod";

import { getBookingEmailTemplates, upsertBookingEmailTemplates } from "@/lib/(resend)/communication/template-store";
import { syncBookingSequenceToFile } from "@/lib/(resend)/sequences/sync-to-file";
import {
  bookingSequenceTypesFor,
  getResendSequence,
} from "@/lib/(resend)/sequences/registry";
import { deleteResendSequence } from "@/lib/engin/communication/delete-sequence";
import type { Niche } from "@/lib/legacy/admin/navigation";
import { followUpRequiresEmptySubject } from "@/lib/legacy/booking-communication/sequence-pattern";
import type { BookingEmailType } from "@/lib/legacy/booking-communication/types";
import { isLeadCategory } from "@/lib/legacy/link-tracking/types";

const nicheSchema = z.enum(["agence", "comptable", "entreprise", "cif"]);

const putSchema = z.object({
  niche: nicheSchema,
  steps: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        delay: z.string(),
        subject: z.string(),
        body: z.string().min(1),
      }),
    )
    .min(1),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const sequence = getResendSequence(slug);
  if (!sequence) {
    return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
  }

  const nicheParam = new URL(request.url).searchParams.get("niche");
  const niche = nicheSchema.safeParse(nicheParam ?? sequence.audiences[0]);
  if (!niche.success || !isLeadCategory(niche.data)) {
    return NextResponse.json({ error: "Invalid niche" }, { status: 400 });
  }

  const emailTypes = bookingSequenceTypesFor(slug, niche.data as Niche);
  const templates = await getBookingEmailTemplates(niche.data);
  const byType = new Map(templates.map((row) => [row.email_type, row]));
  const steps = sequence.steps.map((step, index) => {
    const emailType = step.emailType ?? emailTypes[index];
    const row = emailType ? byType.get(emailType) : undefined;
    return {
      id: step.id,
      label: step.label,
      delay: step.delay,
      emailType,
      subject: row?.subject ?? "",
      body: row?.body ?? "",
      subjectManaged: emailType ? followUpRequiresEmptySubject(emailType) : false,
    };
  });

  return NextResponse.json({
    sequence: {
      slug: sequence.slug,
      name: sequence.name,
      description: sequence.description,
      category: sequence.category,
      audiences: sequence.audiences,
    },
    niche: niche.data,
    steps,
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const sequence = getResendSequence(slug);
  if (!sequence) {
    return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
  }

  const parsed = putSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (!isLeadCategory(parsed.data.niche)) {
    return NextResponse.json({ error: "Invalid niche" }, { status: 400 });
  }

  const emailTypes = bookingSequenceTypesFor(slug, parsed.data.niche as Niche);
  const templates = parsed.data.steps.map((step, index) => {
    const emailType = (sequence.steps[index]?.emailType ?? emailTypes[index]) as BookingEmailType;
    return {
      email_type: emailType,
      subject: followUpRequiresEmptySubject(emailType) ? "" : step.subject,
      body: step.body,
    };
  });

  await upsertBookingEmailTemplates(parsed.data.niche, templates);
  syncBookingSequenceToFile({
    niche: parsed.data.niche,
    slug,
    emailTypes: templates.map((row) => row.email_type),
    stepMeta: parsed.data.steps.map((step) => ({
      id: step.id,
      label: step.label,
      delay: step.delay,
    })),
    templates,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  try {
    await deleteResendSequence(slug);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    const status = message === "sequence_not_found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
