"use server";

import { revalidatePath } from "next/cache";

import { managementHref } from "@/lib/admin/navigation";

import { resumeJobsForRecipient } from "../job-controls";
import { getRecipient, updateRecipientStatus } from "../queries";

export type ResumeSequenceRecipientInput = {
  recipientId: string;
};

export type ResumeSequenceRecipientResult =
  | { ok: true; jobRescheduled: boolean }
  | { ok: false; error: string };

export async function resumeSequenceRecipient(
  input: ResumeSequenceRecipientInput,
): Promise<ResumeSequenceRecipientResult> {
  const recipient = await getRecipient(input.recipientId);
  if (!recipient) {
    return { ok: false, error: "recipient_not_found" };
  }

  if (recipient.status !== "paused") {
    return { ok: false, error: "not_paused" };
  }

  const jobRescheduled = await resumeJobsForRecipient(recipient);
  await updateRecipientStatus(recipient.id, {
    status: "active",
    paused_at: null,
    stopped_reason: null,
    started_at: recipient.started_at ?? new Date().toISOString(),
  });

  revalidatePath(managementHref(recipient.lead_category));
  return { ok: true, jobRescheduled };
}
