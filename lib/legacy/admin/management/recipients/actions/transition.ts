"use server";

import { revalidatePath } from "next/cache";

import { managementHref, type Niche } from "@/lib/legacy/admin/navigation";

import { transitionPhase } from "../live-sync";
import { getRecipient } from "../queries";
import { isValidPhaseTransition } from "../transitions";

export type TransitionSequenceRecipientInput = {
  recipientId: string;
  toSlug: string;
  currentStep?: string;
};

export type TransitionSequenceRecipientResult =
  | { ok: true; enrolledId: string }
  | { ok: false; error: string };

export async function transitionSequenceRecipient(
  input: TransitionSequenceRecipientInput,
): Promise<TransitionSequenceRecipientResult> {
  const recipient = await getRecipient(input.recipientId);
  if (!recipient) {
    return { ok: false, error: "recipient_not_found" };
  }

  if (!isValidPhaseTransition(recipient.sequence_slug, input.toSlug)) {
    return { ok: false, error: "invalid_phase_transition" };
  }

  const result = await transitionPhase({
    leadEmail: recipient.lead_email,
    niche: recipient.lead_category as Niche,
    fromSlug: recipient.sequence_slug,
    toSlug: input.toSlug,
    campaignId: recipient.campaign_id,
    currentStep: input.currentStep,
    metadata: { transitioned_via: "management" },
  });

  revalidatePath(managementHref(recipient.lead_category));
  return { ok: true, enrolledId: result.enrolled.recipient.id };
}
