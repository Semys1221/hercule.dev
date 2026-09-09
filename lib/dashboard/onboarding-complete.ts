import type { SupabaseClient } from "@supabase/supabase-js";

import { isSeedSlug } from "@/lib/admin/clients/seed";
import {
  activateAfterRetraction,
  startRetractionHold,
} from "@/lib/retraction/activate";
import { retractionAppliesTo } from "@/lib/retraction/applies";
import { computeRetractionEndsAt } from "@/lib/retraction/dates";
import { syncProfileRetraction } from "@/lib/retraction/profile-sync";
import type { LeadCategory } from "@/lib/link-tracking/types";

export async function completeBuyerOnboarding(params: {
  client: SupabaseClient;
  category: LeadCategory;
  leadId: string;
  slug: string;
  profile: Record<string, unknown>;
  waiveRetraction: boolean;
}): Promise<void> {
  const now = new Date();
  const completedAt = now.toISOString();

  let profile = { ...params.profile };
  if (params.waiveRetraction && retractionAppliesTo(params.category)) {
    profile = syncProfileRetraction(profile, "waived");
  } else if (retractionAppliesTo(params.category)) {
    profile = syncProfileRetraction(profile, "pending");
  }

  const patch: Record<string, unknown> = {
    profile,
    onboarding_completed_at: completedAt,
  };

  if (params.waiveRetraction && retractionAppliesTo(params.category)) {
    patch.retraction_status = "waived";
    patch.retraction_waived_at = completedAt;
    patch.retraction_ends_at = null;
  } else if (retractionAppliesTo(params.category)) {
    const endsAt = computeRetractionEndsAt(now);
    patch.retraction_status = "pending";
    patch.retraction_ends_at = endsAt.toISOString();
    patch.retraction_waived_at = null;
  }

  const { error } = await params.client
    .from(params.category)
    .update(patch)
    .eq("id", params.leadId);

  if (error) {
    throw new Error(error.message);
  }

  if (params.waiveRetraction && retractionAppliesTo(params.category)) {
    await activateAfterRetraction({
      client: params.client,
      category: params.category,
      leadId: params.leadId,
      slug: params.slug,
      source: "onboarding_waiver",
      dryRun: isSeedSlug(params.slug),
    });
    return;
  }

  if (retractionAppliesTo(params.category)) {
    await startRetractionHold({
      category: params.category,
      leadId: params.leadId,
      slug: params.slug,
      completedAt: now,
    });
  }
}

export async function waiveRetractionNow(params: {
  client: SupabaseClient;
  category: LeadCategory;
  leadId: string;
  slug: string;
  currentStatus: string | null | undefined;
  onboardingCompletedAt: string | null | undefined;
}): Promise<{ ok: boolean; error?: string; status?: number }> {
  if (!retractionAppliesTo(params.category)) {
    return { ok: false, error: "Retraction not applicable", status: 400 };
  }

  if (!params.onboardingCompletedAt) {
    return { ok: false, error: "Onboarding required before waiver", status: 403 };
  }

  if (params.currentStatus === "waived" || params.currentStatus === "expired") {
    return { ok: true };
  }

  if (params.currentStatus !== "pending") {
    return { ok: false, error: "Retraction window not active", status: 409 };
  }

  await activateAfterRetraction({
    client: params.client,
    category: params.category,
    leadId: params.leadId,
    slug: params.slug,
    source: "waiver",
    dryRun: isSeedSlug(params.slug),
  });

  return { ok: true };
}
