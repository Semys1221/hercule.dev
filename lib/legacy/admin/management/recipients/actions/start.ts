"use server";

import { revalidatePath } from "next/cache";

import { managementHref, type Niche } from "@/lib/legacy/admin/navigation";

import { createLinkTrackingClient, findLeadByEmail, normalizeEmail } from "@/lib/legacy/link-tracking/supabase";

import { resolveCampaignIdForNiche } from "../job-controls";
import { dispatchSequenceStart } from "../dispatch";
import { phaseForSequenceSlug, providerForSlug } from "../phase-map";
import { findActiveRecipient, updateRecipientStatus, upsertRecipientRow } from "../queries";

export type StartSequenceRecipientInput = {
  leadEmail: string;
  niche: Niche;
  sequenceSlug: string;
  campaignId?: string;
  scheduledAt?: string;
};

export type StartSequenceRecipientResult =
  | { ok: true; recipientId: string }
  | { ok: false; error: string };

export async function startSequenceRecipient(
  input: StartSequenceRecipientInput,
): Promise<StartSequenceRecipientResult> {
  const phase = phaseForSequenceSlug(input.sequenceSlug);
  const provider = providerForSlug(input.sequenceSlug);
  if (!phase || !provider) {
    return { ok: false, error: "invalid_sequence_slug" };
  }

  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : undefined;
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
    return { ok: false, error: "invalid_scheduled_at" };
  }

  const campaignId =
    input.campaignId ??
    (phase === "outreach" ? await resolveCampaignIdForNiche(input.niche) : null);

  const dispatch = await dispatchSequenceStart({
    sequenceSlug: input.sequenceSlug,
    niche: input.niche,
    leadEmail: input.leadEmail,
    campaignId: campaignId ?? undefined,
    scheduledAt,
  });

  if (!dispatch.ok) {
    return { ok: false, error: dispatch.error };
  }

  const now = new Date().toISOString();
  const isFuture = scheduledAt && scheduledAt.getTime() > Date.now();

  const client = createLinkTrackingClient();
  const lookup = await findLeadByEmail(client, input.leadEmail);
  const leadId =
    lookup?.category === input.niche ? lookup.lead.id : lookup?.lead.id ?? null;

  const existing = await findActiveRecipient({
    leadEmail: input.leadEmail,
    niche: input.niche,
    sequenceSlug: input.sequenceSlug,
  });

  const recipient = existing
    ? await updateRecipientStatus(existing.id, {
        lead_id: leadId,
        status: isFuture ? "scheduled" : "active",
        campaign_id: campaignId,
        current_step: dispatch.currentStep ?? null,
        scheduled_at: scheduledAt?.toISOString() ?? null,
        started_at: isFuture ? existing.started_at : now,
        paused_at: null,
        stopped_reason: null,
      })
    : await upsertRecipientRow({
        lead_email: normalizeEmail(input.leadEmail),
        lead_id: leadId,
        lead_category: input.niche,
        phase,
        sequence_slug: input.sequenceSlug,
        provider,
        status: isFuture ? "scheduled" : "active",
        campaign_id: campaignId,
        current_step: dispatch.currentStep ?? null,
        scheduled_at: scheduledAt?.toISOString() ?? null,
        started_at: isFuture ? null : now,
        paused_at: null,
        completed_at: null,
        stopped_reason: null,
        metadata: { started_via: "management" },
      });

  revalidatePath(managementHref(input.niche));
  return { ok: true, recipientId: recipient.id };
}
