import { NextResponse } from "next/server";

import { cancelFollowUpJobs } from "@/lib/booking-communication/jobs";
import {
  parseInviteeCanceledPayload,
  parseInviteeCreatedPayload,
  verifyCalendlySignature,
} from "@/lib/calendly";
import { getCalendlyWebhookSigningKey } from "@/lib/env";
import { syncLeadStatutToInstantly } from "@/lib/link-tracking/instantly";
import { bookLeadFromCalendly } from "@/lib/link-tracking/book-lead";
import {
  createLinkTrackingClient,
  findLeadByEmail,
  markLeadCancelled,
} from "@/lib/link-tracking/supabase";

function firstNameFromFullName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function companyFromQuestions(
  questions: Array<{ question: string; answer: string }>,
): string | null {
  const keys = ["entreprise", "société", "societe", "company", "agence", "cabinet"];
  for (const item of questions) {
    const q = item.question.toLowerCase();
    if (keys.some((key) => q.includes(key)) && item.answer.trim()) {
      return item.answer.trim();
    }
  }
  return null;
}

async function handleInviteeCanceled(payload: unknown) {
  const canceled = parseInviteeCanceledPayload(payload);
  if (!canceled) {
    return NextResponse.json({ ok: true, ignored: "parse_failed" });
  }

  const client = createLinkTrackingClient();
  const lookup = await findLeadByEmail(client, canceled.email);
  if (!lookup) {
    return NextResponse.json({ ok: true, ignored: "lead_not_found" });
  }

  if (lookup.lead.statut === "CANCELLED") {
    return NextResponse.json({ ok: true, already_cancelled: true });
  }

  const cancelled = await markLeadCancelled(client, lookup);
  await cancelFollowUpJobs(cancelled.lead.id);

  try {
    await syncLeadStatutToInstantly(
      cancelled.lead,
      cancelled.category,
      "CANCELLED",
    );
  } catch (err) {
    console.error("[link-tracking/calendly] Instantly cancel sync:", err);
  }

  return NextResponse.json({ ok: true, statut: "CANCELLED" });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("calendly-webhook-signature");
  const signingKey = getCalendlyWebhookSigningKey();

  if (signingKey && !verifyCalendlySignature(rawBody, signature, signingKey)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType =
    payload && typeof payload === "object" && "event" in payload
      ? String((payload as { event?: string }).event ?? "unknown")
      : "unknown";

  if (eventType === "invitee.canceled") {
    try {
      return await handleInviteeCanceled(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[link-tracking/calendly] cancel:", message);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (eventType !== "invitee.created") {
    return NextResponse.json({ ok: true, ignored: eventType });
  }

  const invitee = parseInviteeCreatedPayload(payload);
  if (!invitee) {
    return NextResponse.json({ ok: true, ignored: "parse_failed" });
  }

  if (!invitee.utmContent) {
    return NextResponse.json({ ok: true, ignored: "missing_utm_content" });
  }

  const questions: Record<string, string> = {};
  for (const qa of invitee.questionsAndAnswers) {
    if (qa.question) questions[qa.question] = qa.answer ?? "";
  }

  try {
    const result = await bookLeadFromCalendly({
      email: invitee.email,
      slug: invitee.utmContent,
      invitee,
      firstName: firstNameFromFullName(invitee.name),
      company: companyFromQuestions(invitee.questionsAndAnswers),
      scheduledAt: invitee.startTime || null,
      calendlyPayload:
        payload && typeof payload === "object"
          ? (payload as Record<string, unknown>)
          : null,
      calendlyQuestions: Object.keys(questions).length > 0 ? questions : null,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[link-tracking/calendly]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
