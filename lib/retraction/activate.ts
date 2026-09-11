import type { SupabaseClient } from "@supabase/supabase-js";

import { isSeedSlug } from "@/lib/admin/clients/seed";
import { COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";
import { cancelPendingJobsForLead } from "@/lib/booking-communication/jobs";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import { createLinkTrackingClient, findLeadById } from "@/lib/link-tracking/supabase";
import type { LeadCategory } from "@/lib/link-tracking/types";
import { transitionToInDeliverance } from "@/lib/product/transitions";

import { retractionAppliesTo } from "./applies";
import {
  activationAt,
  computeRetractionEndsAt,
  estimatedFirstBookingAt,
} from "./dates";
import { syncProfileRetraction } from "./profile-sync";
import type { RetractionStatus } from "./types";

const HOLD_EMAIL_TYPES: BookingEmailType[] = ["onboarding_retraction_hold"];

export type ActivationSource = "waiver" | "expired" | "onboarding_waiver";

export async function patchProfileEstimatedBooking(
  client: SupabaseClient,
  category: LeadCategory,
  leadId: string,
  activation: Date,
  status: RetractionStatus,
): Promise<void> {
  const lead = await findLeadById(client, category, leadId);
  if (!lead) return;

  const profile = { ...(lead.profile ?? {}) } as Record<string, unknown>;
  const dashboard = { ...((profile.dashboard ?? {}) as Record<string, unknown>) };
  const estimated = estimatedFirstBookingAt(activation, status, false, category);
  dashboard.estimated_first_booking_at = estimated.toISOString();
  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "9c08cc",
    },
    body: JSON.stringify({
      sessionId: "9c08cc",
      runId: "pre-fix",
      hypothesisId: "A",
      location: "lib/retraction/activate.ts:patchProfileEstimatedBooking",
      message: "estimated_first_booking_at persisted",
      data: {
        category,
        leadId,
        retractionStatus: status,
        activationAt: activation.toISOString(),
        estimatedFirstBookingAt: estimated.toISOString(),
        daysFromActivation: Math.round(
          (estimated.getTime() - activation.getTime()) / (24 * 60 * 60 * 1000),
        ),
        expectedComptableDaysMax:
          category === "comptable" ? COMMERCIAL_COMPTABLE.firstRdvDaysMax : null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  profile.dashboard = dashboard;

  await client.from(category).update({ profile }).eq("id", leadId);
}

export async function startRetractionHold(params: {
  category: LeadCategory;
  leadId: string;
  slug: string;
  completedAt: Date;
}): Promise<void> {
  if (!retractionAppliesTo(params.category)) return;

  const client = createLinkTrackingClient();
  const endsAt = computeRetractionEndsAt(params.completedAt);
  const isTestLead = isSeedSlug(params.slug);

  const lead = await findLeadById(client, params.category, params.leadId);
  if (!lead) return;

  let profile = { ...(lead.profile ?? {}) } as Record<string, unknown>;
  profile = syncProfileRetraction(profile, "pending");

  await client
    .from(params.category)
    .update({
      retraction_status: "pending",
      retraction_ends_at: endsAt.toISOString(),
      retraction_waived_at: null,
      profile,
    })
    .eq("id", params.leadId);

  await patchProfileEstimatedBooking(
    client,
    params.category,
    params.leadId,
    endsAt,
    "pending",
  );

  if (isTestLead) return;

  try {
    const { startOnboardingRetractionHold } = await import(
      "@/lib/onboarding-sequence/orchestrator"
    );
    await startOnboardingRetractionHold(params.category, params.leadId);
  } catch (error) {
    console.error(
      "[retraction/activate] hold email failed:",
      error instanceof Error ? error.message : error,
    );
  }
}

export async function activateAfterRetraction(params: {
  client: SupabaseClient;
  category: LeadCategory;
  leadId: string;
  slug: string;
  source: ActivationSource;
  dryRun?: boolean;
}): Promise<{ activated: boolean; reason?: string }> {
  if (!retractionAppliesTo(params.category)) {
    return { activated: false, reason: "not_applicable" };
  }

  const lead = await findLeadById(params.client, params.category, params.leadId);
  if (!lead) {
    return { activated: false, reason: "lead_not_found" };
  }

  const productStatut = lead.product_statut ?? "NONE";

  if (
    productStatut === "IN_DELIVERANCE" ||
    productStatut === "MATCH_PROPOSED" ||
    productStatut === "MEETING_BOOKED"
  ) {
    return { activated: false, reason: "already_in_deliverance" };
  }

  const now = new Date();
  const nextStatus: RetractionStatus =
    params.source === "expired" ? "expired" : "waived";

  let profile = { ...(lead.profile ?? {}) } as Record<string, unknown>;
  profile = syncProfileRetraction(profile, nextStatus);

  const activation = activationAt({
    status: nextStatus,
    waivedAt: nextStatus === "waived" ? now.toISOString() : lead.retraction_waived_at ?? null,
    endsAt: lead.retraction_ends_at ?? null,
    completedAt: lead.onboarding_completed_at ?? null,
  }) ?? now;

  const patch: Record<string, unknown> = {
    retraction_status: nextStatus,
    profile,
  };

  if (nextStatus === "waived") {
    patch.retraction_waived_at = now.toISOString();
  }

  await params.client.from(params.category).update(patch).eq("id", params.leadId);

  await patchProfileEstimatedBooking(
    params.client,
    params.category,
    params.leadId,
    activation,
    nextStatus,
  );

  const isTestLead = params.dryRun ?? isSeedSlug(params.slug);

  try {
    await transitionToInDeliverance(params.client, params.leadId, params.category);
  } catch (transitionError) {
    console.error(
      "[retraction/activate] transitionToInDeliverance failed:",
      transitionError instanceof Error ? transitionError.message : transitionError,
    );
  }

  try {
    await cancelPendingJobsForLead(params.leadId, HOLD_EMAIL_TYPES);
  } catch (cancelError) {
    console.error(
      "[retraction/activate] cancel hold jobs failed:",
      cancelError instanceof Error ? cancelError.message : cancelError,
    );
  }

  if (params.category === "agence") {
    try {
      const { startCalendlySeatWorkflow } = await import(
        "@/lib/calendly-seat-onboarding/orchestrator"
      );
      await startCalendlySeatWorkflow(params.leadId, { dryRun: isTestLead });
    } catch (workflowError) {
      console.error(
        "[retraction/activate] calendly seat workflow failed:",
        workflowError instanceof Error ? workflowError.message : workflowError,
      );
    }
  }

  if (!isTestLead) {
    try {
      const { startOnboardingSequence } = await import(
        "@/lib/onboarding-sequence/orchestrator"
      );
      await startOnboardingSequence(params.category, params.leadId);
    } catch (sequenceError) {
      console.error(
        "[retraction/activate] onboarding sequence failed:",
        sequenceError instanceof Error ? sequenceError.message : sequenceError,
      );
    }
  }

  return { activated: true };
}

export async function expirePendingRetractions(): Promise<{
  processed: number;
  activated: number;
}> {
  const client = createLinkTrackingClient();
  const now = new Date().toISOString();
  let activated = 0;

  for (const category of ["agence", "comptable"] as const) {
    const { data, error } = await client
      .from(category)
      .select("id, slug, retraction_status, retraction_ends_at")
      .eq("retraction_status", "pending")
      .lte("retraction_ends_at", now);

    if (error) {
      throw new Error(error.message);
    }

    for (const row of data ?? []) {
      const result = await activateAfterRetraction({
        client,
        category,
        leadId: row.id as string,
        slug: row.slug as string,
        source: "expired",
      });
      if (result.activated) {
        activated++;
      }
    }
  }

  return {
    processed: activated,
    activated,
  };
}
