import type { SupabaseClient } from "@supabase/supabase-js";

import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { DashboardFormData } from "@/lib/dashboard/types";

export function createOnboardingClient(): SupabaseClient {
  return createLinkTrackingClient();
}

/**
 * Overwrites `agence.profile.form` with the provided formPatch.
 *
 * Fetch-merge-update pattern (same as dashboard PATCH route):
 * 1. Fetch the current profile JSONB for the agence row.
 * 2. Replace the `form` key entirely with formPatch.
 * 3. Write the merged profile back.
 *
 * Called on every qualification save — intentional overwrite so the
 * dashboard form always reflects the latest qualification answers.
 */
export async function prefillAgenceFormFromQualification(
  client: SupabaseClient,
  agenceId: string,
  formPatch: Partial<DashboardFormData>,
): Promise<void> {
  // Fetch current profile
  const { data, error: fetchError } = await client
    .from("agence")
    .select("profile")
    .eq("id", agenceId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`prefillAgenceForm: fetch failed — ${fetchError.message}`);
  }

  if (!data) {
    // Agence row not found; skip silently (could be test data or race condition)
    return;
  }

  const existingProfile = (data.profile ?? {}) as Record<string, unknown>;

  // Preserve all existing profile keys; overwrite only `form`
  const updatedProfile: Record<string, unknown> = {
    ...existingProfile,
    form: {
      // Keep any existing form values that are NOT mapped from qualification
      // (e.g. `zone` which the client must fill manually)
      ...((existingProfile.form ?? {}) as Record<string, unknown>),
      ...formPatch,
    },
  };

  const { error: updateError } = await client
    .from("agence")
    .update({ profile: updatedProfile })
    .eq("id", agenceId);

  if (updateError) {
    throw new Error(`prefillAgenceForm: update failed — ${updateError.message}`);
  }
}
