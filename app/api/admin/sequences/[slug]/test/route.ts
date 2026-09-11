import { NextResponse } from "next/server";
import { z } from "zod";

import { bookingSequenceTypesFor, getEmailSequence } from "@/lib/admin/email-sequences/registry";
import { sendSequenceTestEmail } from "@/lib/admin/sequences/send-test-email";
import { isNiche } from "@/lib/admin/navigation";
import { isBookingEmailType } from "@/lib/booking-communication/route-utils";

const bodySchema = z.object({
  niche: z.enum(["agence", "comptable", "entreprise", "cif"]),
  stepId: z.string().min(1),
  recipientEmail: z.string().email(),
  subject: z.string().optional(),
  body: z.string().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const sequence = getEmailSequence(slug);
  if (!sequence || sequence.editorKind !== "booking") {
    return NextResponse.json({ error: "Sequence not testable" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!isNiche(parsed.data.niche)) {
    return NextResponse.json({ error: "Invalid niche" }, { status: 400 });
  }

  const emailTypes = bookingSequenceTypesFor(slug, parsed.data.niche);
  const stepIndex = sequence.steps.findIndex((step) => step.id === parsed.data.stepId);
  if (stepIndex < 0 || stepIndex >= emailTypes.length) {
    return NextResponse.json({ error: "Unknown step" }, { status: 400 });
  }

  const emailType = emailTypes[stepIndex];
  if (!isBookingEmailType(emailType)) {
    return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
  }

  const category =
    sequence.bookingCategory ??
    (parsed.data.niche === "entreprise" ? "entreprise" : parsed.data.niche);
  const categoryAllowed =
    category === "agence" ||
    category === "entreprise" ||
    category === "comptable";
  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "8b6caf",
    },
    body: JSON.stringify({
      sessionId: "8b6caf",
      location: "app/api/admin/sequences/[slug]/test/route.ts:category-gate",
      message: "sequence test category gate",
      data: {
        slug,
        niche: parsed.data.niche,
        bookingCategory: sequence.bookingCategory ?? null,
        category,
        categoryAllowed,
        hypothesisId: "A",
      },
      timestamp: Date.now(),
      hypothesisId: "A",
      runId: "pre-fix",
    }),
  }).catch(() => {});
  // #endregion
  if (category !== "agence" && category !== "entreprise" && category !== "comptable") {
    return NextResponse.json({ error: "Unsupported category" }, { status: 400 });
  }

  try {
    const result = await sendSequenceTestEmail({
      category,
      emailType,
      recipientEmail: parsed.data.recipientEmail,
      subject: parsed.data.subject,
      body: parsed.data.body,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Test send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
