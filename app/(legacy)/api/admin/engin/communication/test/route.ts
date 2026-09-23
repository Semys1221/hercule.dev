import { NextResponse } from "next/server";
import { z } from "zod";

import { renderNotification } from "@/lib/(resend)/notifications/file-io";
import { sendBookingEmail } from "@/lib/(resend)/communication/send";
import {
  bookingSequenceTypesFor,
  getResendSequence,
} from "@/lib/(resend)/sequences/registry";
import { ENGIN_TEST_FROM, ENGIN_TEST_RECIPIENT } from "@/lib/engin/communication/constants";
import type { Niche } from "@/lib/legacy/admin/navigation";
import { isBookingEmailType } from "@/lib/legacy/booking-communication/route-utils";
import { sendSequenceTestEmail } from "@/lib/legacy/admin/sequences/send-test-email";
import { isLeadCategory } from "@/lib/legacy/link-tracking/types";

const bodySchema = z.object({
  kind: z.enum(["sequence", "notification"]),
  id: z.string().min(1),
  niche: z.enum(["agence", "comptable", "entreprise", "cif"]).optional(),
  stepId: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  recipientEmail: z.string().email().optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const recipient = parsed.data.recipientEmail ?? ENGIN_TEST_RECIPIENT;

  if (parsed.data.kind === "notification") {
    const rendered = renderNotification(parsed.data.id, {
      greeting: "Bonjour Camille,",
      displayName: "Camille",
      email: recipient,
      slug: "exemple",
      dashboardLink: "https://www.hercule.dev/clients/exemple",
      dashboardUrl: "https://www.hercule.dev/clients/exemple?renewal=1",
      balance: "0 / 10",
      standardBody: "Vos rendez-vous restants continuent jusqu'à la date affichée.",
      eliteBody: "Vous conservez la file prioritaire.",
      ctaPause: "Je m'arrête",
      ctaContinue: "Je valide",
      fieldLabel: "crédits utilisés",
      signedDelta: "+1",
      before: "1 / 10",
      after: "2 / 10",
      reasonLine: "",
      subscriptionId: "sub_exemple",
      details: "Détail d'exemple.",
    });
    const result = await sendBookingEmail({
      to: recipient,
      subject: parsed.data.subject?.trim() || rendered.subject,
      text: parsed.data.body?.trim() || rendered.text,
      from: ENGIN_TEST_FROM,
      idempotencyKey: `engin-communication-test:${parsed.data.id}:${recipient}:${Date.now()}`,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, resendEmailId: result.id });
  }

  const sequence = getResendSequence(parsed.data.id);
  if (!sequence) {
    return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
  }
  const niche = parsed.data.niche ?? sequence.audiences.find((item) => isLeadCategory(item));
  if (!niche || !isLeadCategory(niche)) {
    return NextResponse.json({ error: "Invalid niche" }, { status: 400 });
  }
  const emailTypes = bookingSequenceTypesFor(parsed.data.id, niche as Niche);
  const stepIndex = parsed.data.stepId
    ? sequence.steps.findIndex((step) => step.id === parsed.data.stepId)
    : 0;
  const emailType = emailTypes[stepIndex] ?? sequence.steps[stepIndex]?.emailType;
  if (!emailType || !isBookingEmailType(emailType)) {
    return NextResponse.json({ error: "Unknown step" }, { status: 400 });
  }

  try {
    const result = await sendSequenceTestEmail({
      category: niche,
      emailType,
      recipientEmail: recipient,
      subject: parsed.data.subject,
      body: parsed.data.body,
      from: ENGIN_TEST_FROM,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Test send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
