import { getCalendlySeatStatus } from "@/lib/calendly/org";
import { createLinkTrackingClient, findLeadById } from "@/lib/link-tracking/supabase";

import { sendCalendlySeatEmail } from "./send";
import {
  findCalendlySeatOnboardingByAgenceId,
  insertCalendlySeatOnboarding,
  listActiveCalendlySeatOnboarding,
  updateCalendlySeatOnboarding,
} from "./store";
import {
  CALENDLY_SEAT_REMINDER_DELAY_MS,
  type CalendlySeatOnboardingStatus,
} from "./types";

export type CalendlySeatWorkflowResult = {
  started: boolean;
  alreadyExists: boolean;
  welcomeSent: boolean;
  dryRun: boolean;
  agenceId: string;
  email: string;
};

export type CalendlySeatCheckResult = {
  checked: number;
  activated: number;
  invitePending: number;
  remindersSent: number;
  dryRun: boolean;
  details: Array<{
    agenceId: string;
    email: string;
    previousStatus: CalendlySeatOnboardingStatus;
    nextStatus: CalendlySeatOnboardingStatus;
    invitationStatus: string | null;
    reminderSent: boolean;
  }>;
};

export async function startCalendlySeatWorkflow(
  agenceId: string,
  options: { dryRun?: boolean } = {},
): Promise<CalendlySeatWorkflowResult> {
  const dryRun = options.dryRun ?? false;
  const client = createLinkTrackingClient();
  const lead = await findLeadById(client, "agence", agenceId);
  if (!lead) {
    throw new Error("lead_not_found");
  }

  const existing = await findCalendlySeatOnboardingByAgenceId(agenceId);
  if (existing) {
    return {
      started: false,
      alreadyExists: true,
      welcomeSent: Boolean(existing.welcome_sent_at),
      dryRun,
      agenceId,
      email: existing.email,
    };
  }

  const idempotencyKey = `calendly-seat:welcome:${agenceId}`;
  let welcomeSent = false;

  if (!dryRun) {
    const sendResult = await sendCalendlySeatEmail({
      agenceId,
      emailType: "product_calendly_welcome",
      triggeredBy: "stripe_payment",
      idempotencyKey,
    });
    welcomeSent = Boolean(sendResult.resendEmailId);
    await insertCalendlySeatOnboarding({
      agenceId,
      email: lead.email,
      welcomeSentAt: new Date().toISOString(),
    });
  } else {
    await sendCalendlySeatEmail({
      agenceId,
      emailType: "product_calendly_welcome",
      triggeredBy: "stripe_payment",
      idempotencyKey,
      dryRun: true,
    });
    welcomeSent = false;
  }

  if (dryRun) {
    return {
      started: true,
      alreadyExists: false,
      welcomeSent,
      dryRun: true,
      agenceId,
      email: lead.email,
    };
  }

  return {
    started: true,
    alreadyExists: false,
    welcomeSent,
    dryRun: false,
    agenceId,
    email: lead.email,
  };
}

function isReminderDue(startedAt: string, reminderSentAt: string | null): boolean {
  if (reminderSentAt) {
    return false;
  }
  const startedMs = new Date(startedAt).getTime();
  if (Number.isNaN(startedMs)) {
    return false;
  }
  return Date.now() - startedMs >= CALENDLY_SEAT_REMINDER_DELAY_MS;
}

export async function checkCalendlySeatWorkflows(
  options: { dryRun?: boolean } = {},
): Promise<CalendlySeatCheckResult> {
  const dryRun = options.dryRun ?? false;
  const rows = await listActiveCalendlySeatOnboarding();
  const result: CalendlySeatCheckResult = {
    checked: 0,
    activated: 0,
    invitePending: 0,
    remindersSent: 0,
    dryRun,
    details: [],
  };

  for (const row of rows) {
    result.checked += 1;
    const seatStatus = dryRun
      ? { invitationStatus: null as const, isMember: false }
      : await getCalendlySeatStatus(row.email);

    let nextStatus: CalendlySeatOnboardingStatus = row.status;
    let reminderSent = false;

    if (seatStatus.isMember || seatStatus.invitationStatus === "accepted") {
      nextStatus = "active";
      result.activated += 1;
    } else if (seatStatus.invitationStatus === "pending") {
      nextStatus = "invite_pending";
      result.invitePending += 1;
    }

    const shouldSendReminder =
      nextStatus !== "active" && isReminderDue(row.started_at, row.reminder_sent_at);

    if (shouldSendReminder) {
      if (!dryRun) {
        await sendCalendlySeatEmail({
          agenceId: row.agence_id,
          emailType: "product_calendly_reminder",
          triggeredBy: "calendly_seat_cron",
          idempotencyKey: `calendly-seat:reminder:${row.agence_id}`,
        });
        await updateCalendlySeatOnboarding(row.id, {
          status: "reminder_sent",
          reminder_sent_at: new Date().toISOString(),
          last_checked_at: new Date().toISOString(),
          calendly_invitation_status: seatStatus.invitationStatus,
        });
      }
      nextStatus = "reminder_sent";
      reminderSent = true;
      result.remindersSent += 1;
    } else if (!dryRun) {
      await updateCalendlySeatOnboarding(row.id, {
        status: nextStatus,
        last_checked_at: new Date().toISOString(),
        calendly_invitation_status: seatStatus.invitationStatus,
      });
    }

    result.details.push({
      agenceId: row.agence_id,
      email: row.email,
      previousStatus: row.status,
      nextStatus,
      invitationStatus: seatStatus.invitationStatus,
      reminderSent,
    });
  }

  return result;
}
