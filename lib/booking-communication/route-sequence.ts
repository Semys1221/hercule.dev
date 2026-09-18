import type { LeadCategory, LinkTrackingLead } from "@/lib/link-tracking/types";

import { isLegacyAgenceLead } from "./legacy";
import { startBookingSequence, startRoleRecoverySequence } from "./orchestrator";
import {
  meetingWeekdayParis,
  planRecoveryByMeetingWeekday,
} from "./schedule";
import type { SequenceTriggeredBy } from "./types";

export type SequenceKind = "main" | "recovery" | "none";

export function sequenceKindForMeeting(
  scheduledAt: string | null | undefined,
  category: LeadCategory,
): SequenceKind {
  if (!scheduledAt?.trim()) {
    return "none";
  }
  if (category !== "agence") {
    return "main";
  }
  const weekday = meetingWeekdayParis(scheduledAt);
  if (weekday === "Mon" || weekday === "Tue" || weekday === "Wed") {
    return "recovery";
  }
  return "main";
}

export async function startSequenceForBookedLead(params: {
  category: LeadCategory;
  lead: LinkTrackingLead;
  triggeredBy: SequenceTriggeredBy;
}): Promise<{ started: boolean; reason?: string }> {
  const { category, lead, triggeredBy } = params;

  if (isLegacyAgenceLead(category, lead)) {
    return { started: false, reason: "legacy" };
  }

  if (!lead.scheduled_at) {
    return { started: false, reason: "missing_scheduled_at" };
  }

  const kind = sequenceKindForMeeting(lead.scheduled_at, category);
  if (kind === "none") {
    return { started: false, reason: "missing_scheduled_at" };
  }

  if (kind === "recovery") {
    const schedule = planRecoveryByMeetingWeekday(lead.scheduled_at);
    const result = await startRoleRecoverySequence({
      category,
      lead,
      triggeredBy,
      recoverySchedule: {
        roleSeq48: schedule.roleSeq48,
        roleSeq24: schedule.roleSeq24,
      },
    });
    const { syncBookingSequenceStarted } = await import(
      "@/lib/admin/management/recipients/hooks"
    );
    syncBookingSequenceStarted({
      niche: category,
      leadEmail: lead.email,
      leadId: lead.id,
      sequenceSlug: "role-recovery",
    });
    return result;
  }

  const result = await startBookingSequence({ category, lead, triggeredBy });
  const { meetingSequenceSlugForNiche } = await import(
    "@/lib/admin/email-sequences/registry"
  );
  const { syncBookingSequenceStarted } = await import(
    "@/lib/admin/management/recipients/hooks"
  );
  syncBookingSequenceStarted({
    niche: category,
    leadEmail: lead.email,
    leadId: lead.id,
    sequenceSlug: meetingSequenceSlugForNiche(category),
  });
  return result;
}
