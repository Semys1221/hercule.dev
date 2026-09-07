import { NextResponse } from "next/server";
import { z } from "zod";

import {
  NOT_PRESENT_SUBJECT,
  resolveNotPresentResendMail,
} from "@/lib/admin/bookings/not-present-send";
import { resolveBookingLead } from "@/lib/admin/bookings/resolve-booking-lead";
import { getThreadContext } from "@/lib/booking-communication/jobs";
import { sendBookingEmail } from "@/lib/booking-communication/send";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import { getInstantlyApiKey, replyToEmail } from "@/lib/instantly-bypass/client";
import { resolveThreadForReply } from "@/lib/instantly-bypass/thread-resolver";
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

type ChannelResult = {
  status: ChannelStatus;
  error?: string;
};

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

async function sendResendNotPresent(params: {
  lead: LinkTrackingLead;
  email: string;
  startTime: string | null | undefined;
  inviteeUri: string;
}): Promise<ChannelResult> {
  let mail = resolveNotPresentResendMail({
    threadSubject: null,
    messageIds: [],
  });

  try {
    const thread = await getThreadContext(params.lead.id, RESEND_THREAD_TYPES);
    mail = resolveNotPresentResendMail(thread);
  } catch (error) {
    console.warn(
      "[admin/bookings/not-present] Thread lookup failed, standalone send:",
      error instanceof Error ? error.message : error,
    );
  }

  const { text, html } = buildNotPresentEmail(
    resolveFirstName(params.lead, params.email),
    params.startTime,
  );

  const result = await sendBookingEmail({
    to: params.email,
    subject: mail.subject,
    text,
    html,
    idempotencyKey: `not-present:resend:${params.inviteeUri}:${Date.now()}`,
    headers: mail.headers,
  });

  if (!result.ok) {
    console.error("[admin/bookings/not-present] Resend failed:", result.error);
    return { status: "error", error: result.error };
  }

  return { status: "sent" };
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
  const subject = thread.subject?.trim() || NOT_PRESENT_SUBJECT;

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
    const lead = await resolveBookingLead({
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

    const resendChannel: ChannelResult =
      resendResult.status === "fulfilled"
        ? resendResult.value
        : {
            status: "error",
            error:
              resendResult.reason instanceof Error
                ? resendResult.reason.message
                : "Resend send failed",
          };
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

    const resend = resendChannel.status;
    const sentCount = [resend, instantly].filter((status) => status === "sent").length;
    if (sentCount === 0) {
      return NextResponse.json(
        {
          error: "Aucun email envoyé",
          resend,
          instantly,
          resendError: resendChannel.error,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      resend,
      instantly,
      resendError: resendChannel.error,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "not-present send failed";
    console.error("[admin/bookings/not-present]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
