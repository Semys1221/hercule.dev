import { NextResponse } from "next/server";
import { z } from "zod";

import { renderNotPresentEmail } from "@/lib/admin/bookings/not-present-email";
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
import type { LeadCategory, LinkTrackingLead } from "@/lib/link-tracking/types";

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

function resolveFirstName(lead: LinkTrackingLead | null, email: string): string {
  const fromLead = lead?.first_name?.trim();
  if (fromLead) {
    return fromLead;
  }
  const localPart = email.split("@")[0]?.trim();
  return localPart || "Bonjour";
}

async function sendResendNotPresent(params: {
  lead: LinkTrackingLead;
  category: LeadCategory;
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

  const { text, html } = await renderNotPresentEmail({
    firstName: resolveFirstName(params.lead, params.email),
    startTime: params.startTime,
    category: params.category,
  });

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
  category: LeadCategory;
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

  const { html } = await renderNotPresentEmail({
    firstName: resolveFirstName(params.lead, params.email),
    startTime: params.startTime,
    category: params.category,
  });
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
    const resolved = await resolveBookingLead({
      leadId: parsed.data.leadId,
      email: parsed.data.email,
      inviteeUri: parsed.data.inviteeUri,
    });

    if (!resolved) {
      return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
    }

    const [resendResult, instantlyResult] = await Promise.allSettled([
      sendResendNotPresent({
        lead: resolved.lead,
        category: resolved.category,
        email: parsed.data.email,
        startTime: parsed.data.startTime,
        inviteeUri: parsed.data.inviteeUri,
      }),
      sendInstantlyNotPresent({
        lead: resolved.lead,
        category: resolved.category,
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
