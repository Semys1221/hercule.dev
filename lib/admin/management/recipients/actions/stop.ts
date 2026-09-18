"use server";

import { revalidatePath } from "next/cache";

import { managementHref } from "@/lib/admin/navigation";

import { cancelJobsForRecipient } from "../job-controls";
import { getRecipient, updateRecipientStatus } from "../queries";

export type StopSequenceRecipientInput = {
  recipientId: string;
  reason?: string;
};

export type StopSequenceRecipientResult =
  | { ok: true; jobsCancelled: number }
  | { ok: false; error: string };

export async function stopSequenceRecipient(
  input: StopSequenceRecipientInput,
): Promise<StopSequenceRecipientResult> {
  const recipient = await getRecipient(input.recipientId);
  if (!recipient) {
    return { ok: false, error: "recipient_not_found" };
  }

  if (recipient.status === "stopped" || recipient.status === "completed") {
    return { ok: true, jobsCancelled: 0 };
  }

  const jobsCancelled = await cancelJobsForRecipient(recipient);
  await updateRecipientStatus(recipient.id, {
    status: "stopped",
    stopped_reason: input.reason?.trim() || "manual_stop",
    paused_at: null,
  });

  revalidatePath(managementHref(recipient.lead_category));
  return { ok: true, jobsCancelled };
}
