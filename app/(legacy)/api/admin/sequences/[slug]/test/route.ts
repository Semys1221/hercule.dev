import { NextResponse } from "next/server";
import { z } from "zod";

import {
  bookingSequenceTypesFor,
  getEmailSequence,
} from "@/lib/legacy/admin/email-sequences/registry";
import { sendBypassSequenceTestEmail } from "@/lib/legacy/admin/sequences/send-bypass-test-email";
import { sendReplyAgentTestEmail } from "@/lib/legacy/admin/sequences/send-reply-agent-test-email";
import { sendSequenceTestEmail } from "@/lib/legacy/admin/sequences/send-test-email";
import { isNiche } from "@/lib/legacy/admin/navigation";
import { isBookingEmailType } from "@/lib/legacy/booking-communication/route-utils";
import { isLeadCategory } from "@/lib/legacy/link-tracking/types";
import type { BypassTemplateKey } from "@/lib/legacy/instantly-bypass/types";

const bodySchema = z.object({
  niche: z.enum(["agence", "comptable", "entreprise", "cif"]),
  stepId: z.string().min(1),
  recipientEmail: z.string().email(),
  subject: z.string().optional(),
  body: z.string().optional(),
  campaignId: z.string().uuid().optional(),
});

function resolveBookingCategory(
  sequence: NonNullable<ReturnType<typeof getEmailSequence>>,
  niche: z.infer<typeof bodySchema>["niche"],
) {
  return (
    sequence.bookingCategory ??
    (niche === "entreprise" ? "entreprise" : niche)
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const sequence = getEmailSequence(slug);
  if (!sequence) {
    return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
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

  if (sequence.editorKind === "booking") {
    const emailTypes = bookingSequenceTypesFor(slug, parsed.data.niche);
    const stepIndex = sequence.steps.findIndex((step) => step.id === parsed.data.stepId);
    if (stepIndex < 0 || stepIndex >= emailTypes.length) {
      return NextResponse.json({ error: "Unknown step" }, { status: 400 });
    }

    const emailType = emailTypes[stepIndex];
    if (!isBookingEmailType(emailType)) {
      return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
    }

    const category = resolveBookingCategory(sequence, parsed.data.niche);
    if (!isLeadCategory(category)) {
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

  if (sequence.editorKind === "bypass") {
    if (!parsed.data.campaignId) {
      return NextResponse.json({ error: "campaignId required" }, { status: 400 });
    }

    const step = sequence.steps.find((item) => item.id === parsed.data.stepId);
    const templateKey = step?.templateKey as BypassTemplateKey | undefined;
    if (!templateKey) {
      return NextResponse.json({ error: "Unknown step" }, { status: 400 });
    }

    try {
      const result = await sendBypassSequenceTestEmail({
        campaignId: parsed.data.campaignId,
        templateKey,
        niche: parsed.data.niche,
        recipientEmail: parsed.data.recipientEmail,
        subject: parsed.data.subject,
        bodyHtml: parsed.data.body,
      });
      return NextResponse.json({ ...result, jobId: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Test send failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (sequence.editorKind === "reply_agent") {
    if (!parsed.data.campaignId) {
      return NextResponse.json({ error: "campaignId required" }, { status: 400 });
    }

    try {
      const result = await sendReplyAgentTestEmail({
        niche: parsed.data.niche,
        campaignId: parsed.data.campaignId,
        recipientEmail: parsed.data.recipientEmail,
        promptSnapshot: parsed.data.body,
      });
      return NextResponse.json({ ...result, jobId: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Test send failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Sequence not testable" }, { status: 404 });
}
