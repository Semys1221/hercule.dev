"use server";

import { revalidatePath } from "next/cache";

import { managementHref } from "@/lib/admin/navigation";

import { rescheduleJobsForRecipient } from "../job-controls";
import { getRecipient, updateRecipientStatus } from "../queries";

export type ScheduleSequenceRecipientInput = {
  recipientId: string;
  scheduledAt: string;
  stepId?: string;
};

export type ScheduleSequenceRecipientResult =
  | { ok: true; jobRescheduled: boolean }
  | { ok: false; error: string };

export async function scheduleSequenceRecipient(
  input: ScheduleSequenceRecipientInput,
): Promise<ScheduleSequenceRecipientResult> {
  const scheduledAt = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return { ok: false, error: "invalid_scheduled_at" };
  }

  const recipient = await getRecipient(input.recipientId);
  if (!recipient) {
    return { ok: false, error: "recipient_not_found" };
  }

  const jobRescheduled = await rescheduleJobsForRecipient(recipient, scheduledAt);

  await updateRecipientStatus(recipient.id, {
    status: "scheduled",
    scheduled_at: scheduledAt.toISOString(),
    current_step: input.stepId?.trim() || recipient.current_step,
    paused_at: null,
  });

  revalidatePath(managementHref(recipient.lead_category));
  return { ok: true, jobRescheduled };
}
