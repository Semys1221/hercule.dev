import {
  createLinkTrackingClient,
  findLeadByEmail,
  normalizeEmail,
} from "@/lib/link-tracking/supabase";
import type { Niche } from "@/lib/admin/navigation";

import { phaseForSequenceSlug, providerForSlug } from "./phase-map";
import {
  findActiveRecipient,
  findActiveRecipientsForEmail,
  updateRecipientStatus,
  upsertRecipientRow,
} from "./queries";
import type { EmailSequenceRecipient, RecipientStatus } from "./types";
import { isValidPhaseTransition } from "./transitions";

export type EnrollRecipientParams = {
  leadEmail: string;
  niche: Niche;
  sequenceSlug: string;
  leadId?: string | null;
  campaignId?: string | null;
  status?: RecipientStatus;
  currentStep?: string | null;
  scheduledAt?: string | null;
  metadata?: Record<string, unknown>;
};

export type SyncRecipientResult = {
  recipient: EmailSequenceRecipient;
  created: boolean;
};

async function resolveLeadId(
  leadEmail: string,
  niche: Niche,
  leadId?: string | null,
): Promise<string | null> {
  if (leadId?.trim()) {
    return leadId.trim();
  }
  const client = createLinkTrackingClient();
  const lookup = await findLeadByEmail(client, leadEmail);
  if (lookup?.category === niche) {
    return lookup.lead.id;
  }
  const { data } = await client
    .from(niche)
    .select("id")
    .eq("email", normalizeEmail(leadEmail))
    .maybeSingle();
  return data?.id ? String(data.id) : null;
}

export async function enrollRecipient(
  params: EnrollRecipientParams,
): Promise<SyncRecipientResult> {
  const leadEmail = normalizeEmail(params.leadEmail);
  const phase = phaseForSequenceSlug(params.sequenceSlug);
  const provider = providerForSlug(params.sequenceSlug);
  if (!phase || !provider) {
    throw new Error(`invalid_sequence_slug:${params.sequenceSlug}`);
  }

  const leadId = await resolveLeadId(leadEmail, params.niche, params.leadId);
  const now = new Date().toISOString();
  const status = params.status ?? "active";

  const existing = await findActiveRecipient({
    leadEmail,
    niche: params.niche,
    sequenceSlug: params.sequenceSlug,
  });

  if (existing) {
    const recipient = await updateRecipientStatus(existing.id, {
      lead_id: leadId,
      status,
      campaign_id: params.campaignId ?? existing.campaign_id,
      current_step: params.currentStep ?? existing.current_step,
      scheduled_at: params.scheduledAt ?? existing.scheduled_at,
      started_at: existing.started_at ?? (status === "active" ? now : null),
      paused_at: null,
      metadata: {
        ...existing.metadata,
        ...params.metadata,
      },
    });
    return { recipient, created: false };
  }

  const recipient = await upsertRecipientRow({
    lead_email: leadEmail,
    lead_id: leadId,
    lead_category: params.niche,
    phase,
    sequence_slug: params.sequenceSlug,
    provider,
    status,
    campaign_id: params.campaignId ?? null,
    current_step: params.currentStep ?? null,
    scheduled_at: params.scheduledAt ?? null,
    started_at: status === "active" || status === "scheduled" ? now : null,
    paused_at: null,
    completed_at: null,
    stopped_reason: null,
    metadata: params.metadata ?? {},
  });
  return { recipient, created: true };
}

export async function advanceRecipientStep(params: {
  leadEmail: string;
  niche: Niche;
  sequenceSlug: string;
  currentStep: string;
}): Promise<EmailSequenceRecipient | null> {
  const existing = await findActiveRecipient({
    leadEmail: params.leadEmail,
    niche: params.niche,
    sequenceSlug: params.sequenceSlug,
  });
  if (!existing) {
    return null;
  }
  return updateRecipientStatus(existing.id, {
    status: "active",
    current_step: params.currentStep,
  });
}

export async function completeRecipient(params: {
  leadEmail: string;
  niche: Niche;
  sequenceSlug: string;
  reason?: string;
}): Promise<EmailSequenceRecipient | null> {
  const existing = await findActiveRecipient({
    leadEmail: params.leadEmail,
    niche: params.niche,
    sequenceSlug: params.sequenceSlug,
  });
  if (!existing) {
    return null;
  }
  const now = new Date().toISOString();
  return updateRecipientStatus(existing.id, {
    status: "completed",
    completed_at: now,
    stopped_reason: params.reason ?? null,
    metadata: {
      ...existing.metadata,
      completed_reason: params.reason ?? "completed",
    },
  });
}

export async function stopRecipient(params: {
  leadEmail: string;
  niche: Niche;
  sequenceSlug?: string;
  campaignId?: string;
  reason: string;
}): Promise<number> {
  const leadEmail = normalizeEmail(params.leadEmail);
  const actives = await findActiveRecipientsForEmail({
    leadEmail,
    niche: params.niche,
    sequenceSlug: params.sequenceSlug,
    campaignId: params.campaignId,
  });
  const now = new Date().toISOString();
  let stopped = 0;
  for (const row of actives) {
    await updateRecipientStatus(row.id, {
      status: "stopped",
      stopped_reason: params.reason,
      metadata: { ...row.metadata, stopped_at: now },
    });
    stopped += 1;
  }
  return stopped;
}

export async function transitionPhase(params: {
  leadEmail: string;
  niche: Niche;
  fromSlug: string;
  toSlug: string;
  campaignId?: string | null;
  currentStep?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ completed: boolean; enrolled: SyncRecipientResult }> {
  if (!isValidPhaseTransition(params.fromSlug, params.toSlug)) {
    throw new Error(`invalid_phase_transition:${params.fromSlug}->${params.toSlug}`);
  }

  await completeRecipient({
    leadEmail: params.leadEmail,
    niche: params.niche,
    sequenceSlug: params.fromSlug,
    reason: `transitioned_to:${params.toSlug}`,
  });

  const enrolled = await enrollRecipient({
    leadEmail: params.leadEmail,
    niche: params.niche,
    sequenceSlug: params.toSlug,
    campaignId: params.campaignId,
    currentStep: params.currentStep,
    status: "active",
    metadata: {
      ...params.metadata,
      transitioned_from: params.fromSlug,
    },
  });

  return { completed: true, enrolled };
}

/** Fire-and-forget wrapper for webhook/cron callers. */
export function syncRecipientFireAndForget(
  fn: () => Promise<unknown>,
  label: string,
): void {
  void fn().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[management-recipients-sync] ${label}:`, message);
  });
}
