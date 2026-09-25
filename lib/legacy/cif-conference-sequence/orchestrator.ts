import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import type { LinkTrackingLead } from "@/lib/legacy/link-tracking/types";
import { reservationCifLinkFor } from "@/lib/legacy/link-tracking/urls";
import { scheduleLeadEmailJobs, sendProductEmailNow } from "@/lib/legacy/booking-communication/product-send";
import type { BookingEmailType } from "@/lib/legacy/booking-communication/types";

import {
  CONFERENCE_INVITE_EMAIL_TYPES,
  CIF_CONFERENCE_TEST_EMAIL,
  isConferenceInviteSendEnabled,
} from "./constants";

const MS_HOUR = 60 * 60 * 1000;

export type StartConferenceInviteSequenceParams = {
  leadId: string;
  /** When true, only preview job schedule — no DB writes or sends. */
  dryRun?: boolean;
  /** Bypass global send guard (fake-lead test only). */
  forceSend?: boolean;
  sequenceStartsAt?: Date;
};

export type StartConferenceInviteSequenceResult = {
  started: boolean;
  reason?: string;
  welcomeSent?: boolean;
  scheduledJobs?: number;
  preview?: Array<{ emailType: BookingEmailType; scheduledFor: string }>;
};

function sequenceBlocked(params: StartConferenceInviteSequenceParams): string | null {
  if (params.dryRun) {
    return null;
  }
  if (params.forceSend) {
    return null;
  }
  if (!isConferenceInviteSendEnabled()) {
    return "send_disabled";
  }
  return null;
}

function emailExtras(lead: LinkTrackingLead) {
  return {
    reservationCifLink: reservationCifLinkFor(lead),
  };
}

export async function startConferenceInviteSequence(
  params: StartConferenceInviteSequenceParams,
): Promise<StartConferenceInviteSequenceResult> {
  const blocked = sequenceBlocked(params);
  if (blocked) {
    return { started: false, reason: blocked };
  }

  const client = createLinkTrackingClient();
  const { data: lead } = await client
    .from("leads")
    .select("*")
    .eq("category", "cif")
    .eq("id", params.leadId)
    .maybeSingle();

  if (!lead) {
    return { started: false, reason: "lead_not_found" };
  }

  const typedLead = lead as LinkTrackingLead;
  const startsAt = params.sequenceStartsAt ?? new Date();
  const idempotencyPrefix = `cif-conference:${params.leadId}`;

  const jobs: Array<{
    emailType: BookingEmailType;
    scheduledFor: Date;
    idempotencyKey: string;
  }> = [
    {
      emailType: "conference_invite_24",
      scheduledFor: new Date(startsAt.getTime() + 24 * MS_HOUR),
      idempotencyKey: `${idempotencyPrefix}:24`,
    },
    {
      emailType: "conference_invite_48",
      scheduledFor: new Date(startsAt.getTime() + 48 * MS_HOUR),
      idempotencyKey: `${idempotencyPrefix}:48`,
    },
    {
      emailType: "conference_invite_72",
      scheduledFor: new Date(startsAt.getTime() + 72 * MS_HOUR),
      idempotencyKey: `${idempotencyPrefix}:72`,
    },
  ];

  const preview = [
    {
      emailType: "conference_invite" as BookingEmailType,
      scheduledFor: startsAt.toISOString(),
    },
    ...jobs.map((job) => ({
      emailType: job.emailType,
      scheduledFor: job.scheduledFor.toISOString(),
    })),
  ];

  if (params.dryRun) {
    return {
      started: true,
      preview,
      scheduledJobs: preview.length,
    };
  }

  const extras = emailExtras(typedLead);

  const welcome = await sendProductEmailNow({
    category: "cif",
    leadId: params.leadId,
    emailType: "conference_invite",
    triggeredBy: "cif_conference_sequence",
    idempotencyKey: `${idempotencyPrefix}:d0`,
    extra: extras,
  });

  const { inserted } = await scheduleLeadEmailJobs({
    category: "cif",
    leadId: params.leadId,
    triggeredBy: "cif_conference_sequence",
    jobs,
  });

  return {
    started: true,
    welcomeSent: welcome.ok,
    scheduledJobs: inserted + (welcome.ok ? 1 : 0),
    preview,
  };
}

export async function ensureConferenceTestLead(): Promise<LinkTrackingLead> {
  const client = createLinkTrackingClient();
  const email = CIF_CONFERENCE_TEST_EMAIL;

  const { data: existing } = await client
    .from("leads")
    .select("*")
    .eq("category", "cif")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return existing as LinkTrackingLead;
  }

  const slug = `conf-test-${Date.now().toString(36)}`;
  const urls = {
    reservation_cif_link: `https://www.hercule.dev/reservation/${slug}`,
    dashboard_link: `https://www.hercule.dev/dashboard/${slug}`,
  };

  const { data: created, error } = await client
    .from("leads")
    .insert({
      email,
      slug,
      statut: "NOTBOOKED",
      first_name: "Test",
      company: "Hercule Internal",
      ...urls,
    })
    .select("*")
    .single();

  if (error || !created) {
    throw new Error(`Failed to create conference test lead: ${error?.message ?? "no row"}`);
  }

  return created as LinkTrackingLead;
}

export function isConferenceInviteEmailType(
  emailType: BookingEmailType,
): boolean {
  return CONFERENCE_INVITE_EMAIL_TYPES.includes(
    emailType as (typeof CONFERENCE_INVITE_EMAIL_TYPES)[number],
  );
}
