"use server";

import { revalidatePath } from "next/cache";

import { managementHref } from "@/lib/legacy/admin/navigation";

import { cancelJobsForRecipient } from "../job-controls";
import { getRecipient, updateRecipientStatus } from "../queries";

export type PauseSequenceRecipientInput = {
  recipientId: string;
  reason?: string;
};

export type PauseSequenceRecipientResult =
  | { ok: true; jobsCancelled: number }
  | { ok: false; error: string };

export async function pauseSequenceRecipient(
  input: PauseSequenceRecipientInput,
): Promise<PauseSequenceRecipientResult> {
  const recipient = await getRecipient(input.recipientId);
  if (!recipient) {
    return { ok: false, error: "recipient_not_found" };
  }

  if (recipient.status === "paused") {
    return { ok: true, jobsCancelled: 0 };
  }

  const jobsCancelled = await cancelJobsForRecipient(recipient);
  await updateRecipientStatus(recipient.id, {
    status: "paused",
    paused_at: new Date().toISOString(),
    stopped_reason: input.reason?.trim() || null,
  });

  revalidatePath(managementHref(recipient.lead_category));
  return { ok: true, jobsCancelled };
}
