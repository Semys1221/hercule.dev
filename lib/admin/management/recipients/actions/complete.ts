"use server";

import { revalidatePath } from "next/cache";

import { managementHref } from "@/lib/admin/navigation";

import { cancelJobsForRecipient } from "../job-controls";
import { getRecipient, updateRecipientStatus } from "../queries";

export type CompleteSequenceRecipientInput = {
  recipientId: string;
  reason?: string;
};

export type CompleteSequenceRecipientResult =
  | { ok: true; jobsCancelled: number }
  | { ok: false; error: string };

export async function completeSequenceRecipient(
  input: CompleteSequenceRecipientInput,
): Promise<CompleteSequenceRecipientResult> {
  const recipient = await getRecipient(input.recipientId);
  if (!recipient) {
    return { ok: false, error: "recipient_not_found" };
  }

  if (recipient.status === "completed") {
    return { ok: true, jobsCancelled: 0 };
  }

  const jobsCancelled = await cancelJobsForRecipient(recipient);
  await updateRecipientStatus(recipient.id, {
    status: "completed",
    completed_at: new Date().toISOString(),
    stopped_reason: input.reason?.trim() || null,
    metadata: {
      ...recipient.metadata,
      completed_reason: input.reason?.trim() || "manual_complete",
    },
  });

  revalidatePath(managementHref(recipient.lead_category));
  return { ok: true, jobsCancelled };
}
