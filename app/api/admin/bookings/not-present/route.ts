import { NextResponse } from "next/server";
import { z } from "zod";

import { getThreadContext } from "@/lib/booking-communication/jobs";
import { sendBookingEmail } from "@/lib/booking-communication/send";
import { buildReplySubject, buildThreadHeaders } from "@/lib/booking-communication/threading";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import { getInstantlyApiKey, replyToEmail } from "@/lib/instantly-bypass/client";
import { resolveThreadForReply } from "@/lib/instantly-bypass/thread-resolver";
import {
  createLinkTrackingClient,
  findLeadByCalendlyInviteeUri,
  findLeadByEmail,
  findLeadById,
} from "@/lib/link-tracking/supabase";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";

const bodySchema = z.object({
  inviteeUri: z.string().min(1),
  leadId: z.string().uuid().nullable().optional(),
  email: z.string().email(),
  startTime: z.string().min(1).nullable().optional(),
});

const RESEND_THREAD_TYPES: BookingEmailType[] = [
  "immediate",
  "h48_confirm",
  "h24_relance",
  "h20_cancel",
];

type ChannelStatus = "sent" | "skipped" | "error";

function formatParisTime(iso: string | null | undefined): string {
  if (!iso?.trim()) {
    return "l'heure prévue";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    timeStyle: "short",
  }).format(date);
}

function resolveFirstName(lead: LinkTrackingLead | null, email: string): string {
  const fromLead = lead?.first_name?.trim();
  if (fromLead) {
    return fromLead;
  }
  const localPart = email.split("@")[0]?.trim();
  return localPart || "Bonjour";
}

function buildNotPresentEmail(firstName: string, startTime: string | null | undefined) {
  const greeting = firstName === "Bonjour" ? "Bonjour" : `Bonjour ${firstName}`;
  const heure = formatParisTime(startTime);
  const text = `${greeting},

Votre rendez-vous avec Hercule était prévu à ${heure}.

Êtes-vous toujours disponible pour notre échange ?`;
  const html = `<p>${greeting},</p>
<p>Votre rendez-vous avec Hercule était prévu à ${heure}.</p>
<p>Êtes-vous toujours disponible pour notre échange ?</p>`;
  return { text, html };
}

async function loadLead(params: {
  leadId?: string | null;
  email: string;
  inviteeUri: string;
}): Promise<LinkTrackingLead | null> {
  const client = createLinkTrackingClient();

  if (params.leadId) {
    const byId = await findLeadById(client, "agence", params.leadId);
    if (byId) {
      return byId;
    }
  }

  const byEmail = await findLeadByEmail(client, params.email);
  if (byEmail?.lead) {
    return byEmail.lead;
  }

  const byInvitee = await findLeadByCalendlyInviteeUri(client, params.inviteeUri);
  return byInvitee?.lead ?? null;
}

async function sendResendNotPresent(params: {
  lead: LinkTrackingLead;
  email: string;
  startTime: string | null | undefined;
  inviteeUri: string;
}): Promise<ChannelStatus> {
  const thread = await getThreadContext(params.lead.id, RESEND_THREAD_TYPES);
  if (!thread.threadSubject || thread.messageIds.length === 0) {
    return "skipped";
  }

  const { text, html } = buildNotPresentEmail(
    resolveFirstName(params.lead, params.email),
    params.startTime,
  );

  const result = await sendBookingEmail({
    to: params.email,
    subject: buildReplySubject(thread.threadSubject),
    text,
    html,
    idempotencyKey: `not-present:resend:${params.inviteeUri}:${Date.now()}`,
    headers: buildThreadHeaders(thread.messageIds),
  });

  if (!result.ok) {
    console.error("[admin/bookings/not-present] Resend failed:", result.error);
    return "error";
  }

  return "sent";
}

async function sendInstantlyNotPresent(params: {
  lead: LinkTrackingLead;
  email: string;
  startTime: string | null | undefined;
}): Promise<ChannelStatus> {
  const campaignId = params.lead.instantly_campaign_id?.trim();
  if (!campaignId) {
    return "skipped";
  }

  const apiKey = getInstantlyApiKey();
  const thread = await resolveThreadForReply(apiKey, {
    leadEmail: params.email,
    campaignId,
  });

  if (!thread) {
    console.error(
      "[admin/bookings/not-present] Instantly thread not found for",
      params.email,
    );
    return "error";
  }

  const { html } = buildNotPresentEmail(
    resolveFirstName(params.lead, params.email),
    params.startTime,
  );
  const subject = thread.subject?.trim() || "Votre rendez-vous avec Hercule";

  try {
    await replyToEmail(apiKey, {
      eaccount: thread.eaccount,
      replyToUuid: thread.replyToUuid,
      subject,
      html,
    });
    return "sent";
  } catch (error) {
    console.error(
      "[admin/bookings/not-present] Instantly failed:",
      error instanceof Error ? error.message : error,
    );
    return "error";
  }
}

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
    const lead = await loadLead({
      leadId: parsed.data.leadId,
      email: parsed.data.email,
      inviteeUri: parsed.data.inviteeUri,
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
    }

    const [resendResult, instantlyResult] = await Promise.allSettled([
      sendResendNotPresent({
        lead,
        email: parsed.data.email,
        startTime: parsed.data.startTime,
        inviteeUri: parsed.data.inviteeUri,
      }),
      sendInstantlyNotPresent({
        lead,
        email: parsed.data.email,
        startTime: parsed.data.startTime,
      }),
    ]);

    const resend: ChannelStatus =
      resendResult.status === "fulfilled" ? resendResult.value : "error";
    const instantly: ChannelStatus =
      instantlyResult.status === "fulfilled" ? instantlyResult.value : "error";

    if (resendResult.status === "rejected") {
      console.error("[admin/bookings/not-present] Resend rejected:", resendResult.reason);
    }
    if (instantlyResult.status === "rejected") {
      console.error(
        "[admin/bookings/not-present] Instantly rejected:",
        instantlyResult.reason,
      );
    }

    const sentCount = [resend, instantly].filter((status) => status === "sent").length;
    if (sentCount === 0) {
      return NextResponse.json(
        {
          error: "Aucun email envoyé",
          resend,
          instantly,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ resend, instantly });
  } catch (error) {
    const message = error instanceof Error ? error.message : "not-present send failed";
    console.error("[admin/bookings/not-present]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
