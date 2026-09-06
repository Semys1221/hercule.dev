import { createLinkTrackingClient, findLeadById } from "@/lib/link-tracking/supabase";
import { scheduleLeadEmailJobs } from "@/lib/booking-communication/product-send";
import { estimatedFirstBookingDateFromLead } from "@/lib/booking-communication/product-vars";
import { formatMeetingDateTime } from "@/lib/booking-communication/templates";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";

function parisWallTime(base: Date, hour: number, dayOffset: number): Date {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(base);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "1");
  const date = new Date(Date.UTC(get("year"), get("month") - 1, get("day") + dayOffset, hour, 0, 0));
  const shown = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
  );
  return new Date(date.getTime() + (hour - shown) * 60 * 60 * 1000);
}

function estimatedAtFromLead(lead: LinkTrackingLead): Date | null {
  const profile = (lead.profile ?? {}) as Record<string, unknown>;
  const dashboard = (profile.dashboard ?? {}) as Record<string, unknown>;
  const raw =
    (typeof dashboard.estimated_first_booking_at === "string"
      ? dashboard.estimated_first_booking_at
      : null) ??
    (typeof profile.estimated_first_booking_at === "string"
      ? profile.estimated_first_booking_at
      : null);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function startOnboardingSequence(
  agenceId: string,
): Promise<{ started: boolean; reason?: string }> {
  const client = createLinkTrackingClient();
  const lead = await findLeadById(client, "agence", agenceId);
  if (!lead) {
    return { started: false, reason: "lead_not_found" };
  }

  const now = new Date();
  const jobs: Array<{
    emailType: BookingEmailType;
    scheduledFor: Date;
    idempotencyKey: string;
  }> = [
    {
      emailType: "onboarding_j0",
      scheduledFor: now,
      idempotencyKey: `onboarding:j0:${agenceId}`,
    },
    {
      emailType: "onboarding_j0_bis",
      scheduledFor: parisWallTime(now, 17, 0),
      idempotencyKey: `onboarding:j0bis:${agenceId}`,
    },
    {
      emailType: "onboarding_j1",
      scheduledFor: parisWallTime(now, 8, 1),
      idempotencyKey: `onboarding:j1:${agenceId}`,
    },
  ];

  const estimated = estimatedAtFromLead(lead);
  if (estimated) {
    const day = 24 * 60 * 60 * 1000;
    jobs.push(
      {
        emailType: "onboarding_reminder_m10",
        scheduledFor: new Date(estimated.getTime() - 10 * day),
        idempotencyKey: `onboarding:m10:${agenceId}`,
      },
      {
        emailType: "onboarding_reminder_m5",
        scheduledFor: new Date(estimated.getTime() - 5 * day),
        idempotencyKey: `onboarding:m5:${agenceId}`,
      },
      {
        emailType: "onboarding_reminder_p5",
        scheduledFor: new Date(estimated.getTime() + 5 * day),
        idempotencyKey: `onboarding:p5:${agenceId}`,
      },
    );
  }

  const { inserted } = await scheduleLeadEmailJobs({
    category: "agence",
    leadId: lead.id,
    triggeredBy: "onboarding_sequence",
    jobs,
  });

  return inserted > 0 ? { started: true } : { started: false, reason: "no_jobs_inserted" };
}

export async function scheduleOnboardingReminders(): Promise<{
  processed: number;
  scheduled: number;
}> {
  const client = createLinkTrackingClient();
  const { data, error } = await client
    .from("agence")
    .select("*")
    .not("onboarding_completed_at", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  let scheduled = 0;
  for (const row of data ?? []) {
    const lead = row as LinkTrackingLead;
    const estimated = estimatedAtFromLead(lead);
    if (!estimated) continue;
    const day = 24 * 60 * 60 * 1000;
    const { inserted } = await scheduleLeadEmailJobs({
      category: "agence",
      leadId: lead.id,
      triggeredBy: "onboarding_sequence",
      jobs: [
        {
          emailType: "onboarding_reminder_m10",
          scheduledFor: new Date(estimated.getTime() - 10 * day),
          idempotencyKey: `onboarding:m10:${lead.id}`,
        },
        {
          emailType: "onboarding_reminder_m5",
          scheduledFor: new Date(estimated.getTime() - 5 * day),
          idempotencyKey: `onboarding:m5:${lead.id}`,
        },
        {
          emailType: "onboarding_reminder_p5",
          scheduledFor: new Date(estimated.getTime() + 5 * day),
          idempotencyKey: `onboarding:p5:${lead.id}`,
        },
      ],
    });
    scheduled += inserted;
  }

  return { processed: (data ?? []).length, scheduled };
}

export function onboardingReminderLabel(lead: LinkTrackingLead): string {
  return estimatedFirstBookingDateFromLead(lead) || formatMeetingDateTime(null).date;
}
