import type { SupabaseClient } from "@supabase/supabase-js";

import { CONFERENCE_CLIENT_TYPES, type ConferenceClientType } from "@/lib/commercial/conference-pricing";
import { computeRetractionEndsAt } from "@/lib/legacy/retraction/dates";
import { syncProfileRetraction } from "@/lib/legacy/retraction/profile-sync";

import { notifyOnboardingAnswers, notifyDecFreeTrialOnboarding } from "@/lib/(resend)/clients/workflows/onboarding-video-conference";

import { CALENDAR_CONNECTED_PROFILE_KEY } from "./dashboard-connections";
import { PRODUCT_STATUT_FREE_TRIAL } from "./dec-free-trial";
import type { ClientVideoConference } from "./video-conference";
import type { ClientRow } from "./types";

function retractionAppliesToClient(clientType: ConferenceClientType): boolean {
  return (
    clientType === CONFERENCE_CLIENT_TYPES.dec ||
    clientType === CONFERENCE_CLIENT_TYPES.cif ||
    clientType === CONFERENCE_CLIENT_TYPES.ias
  );
}

export function buildDecFreeTrialOnboardingPatch(params: {
  row: ClientRow;
  firstName: string;
  calendlySchedulingUrl: string;
  unavailability: string;
  cgvVersion: string;
  completedAt?: string;
}): Record<string, unknown> {
  const completedAt = params.completedAt ?? new Date().toISOString();
  const profile = { ...(params.row.profile ?? {}) };
  profile.cgv_accepted_version = params.cgvVersion;
  profile.cgv_accepted_at = completedAt;
  profile.unavailability = params.unavailability.trim();
  profile[CALENDAR_CONNECTED_PROFILE_KEY] = true;

  return {
    first_name: params.firstName.trim(),
    profile,
    onboarding_completed_at: completedAt,
    product_statut: PRODUCT_STATUT_FREE_TRIAL,
    calendly_scheduling_url: params.calendlySchedulingUrl.trim(),
    retraction_status: null,
    retraction_ends_at: null,
    retraction_waived_at: null,
  };
}

export async function completeDecFreeTrialOnboarding(params: {
  client: SupabaseClient;
  row: ClientRow;
  firstName: string;
  calendlySchedulingUrl: string;
  unavailability: string;
  cgvVersion: string;
}): Promise<void> {
  const completedAt = new Date().toISOString();
  const patch = buildDecFreeTrialOnboardingPatch({ ...params, completedAt });

  const { error } = await params.client.from("clients").update(patch).eq("id", params.row.id);
  if (error) {
    throw new Error(error.message);
  }

  const updatedRow: ClientRow = {
    ...params.row,
    first_name: params.firstName.trim(),
    profile: patch.profile as ClientRow["profile"],
    onboarding_completed_at: completedAt,
    product_statut: PRODUCT_STATUT_FREE_TRIAL,
    calendly_scheduling_url: params.calendlySchedulingUrl.trim(),
  };

  await notifyDecFreeTrialOnboarding({
    client: updatedRow,
    calendlySchedulingUrl: params.calendlySchedulingUrl.trim(),
    unavailability: params.unavailability.trim(),
  });
}

export async function completeClientOnboarding(params: {
  client: SupabaseClient;
  row: ClientRow;
  firstName: string;
  videoConference: ClientVideoConference;
  unavailability: string;
  cgvVersion: string;
  waiveRetraction?: boolean;
}): Promise<void> {
  const now = new Date();
  const completedAt = now.toISOString();
  const applies = retractionAppliesToClient(params.row.client_type);

  let profile = { ...(params.row.profile ?? {}) };
  if (params.waiveRetraction && applies) {
    profile = syncProfileRetraction(profile, "waived");
  } else if (applies) {
    profile = syncProfileRetraction(profile, "pending");
  }
  profile.cgv_accepted_version = params.cgvVersion;
  profile.cgv_accepted_at = completedAt;
  profile.video_conference = params.videoConference;
  const startNow = params.waiveRetraction === true;
  const unavailability = params.unavailability.trim();
  profile.start_now = startNow;
  profile.unavailability = unavailability;

  const patch: Record<string, unknown> = {
    first_name: params.firstName.trim(),
    profile,
    onboarding_completed_at: completedAt,
    product_statut: "ONBOARDED",
  };

  if (params.waiveRetraction && applies) {
    patch.retraction_status = "waived";
    patch.retraction_waived_at = completedAt;
    patch.retraction_ends_at = null;
  } else if (applies) {
    const endsAt = computeRetractionEndsAt(now);
    patch.retraction_status = "pending";
    patch.retraction_ends_at = endsAt.toISOString();
    patch.retraction_waived_at = null;
  }

  const { error } = await params.client.from("clients").update(patch).eq("id", params.row.id);

  if (error) {
    throw new Error(error.message);
  }

  const updatedRow: ClientRow = {
    ...params.row,
    first_name: params.firstName.trim(),
    profile,
    onboarding_completed_at: completedAt,
    product_statut: "ONBOARDED",
  };

  await notifyOnboardingAnswers({
    client: updatedRow,
    videoConference: params.videoConference,
    startNow,
    unavailability,
  });
}

export async function waiveClientRetraction(params: {
  client: SupabaseClient;
  row: ClientRow;
}): Promise<void> {
  if (!retractionAppliesToClient(params.row.client_type)) {
    throw new Error("Retraction not applicable");
  }

  const now = new Date().toISOString();
  const profile = syncProfileRetraction({ ...(params.row.profile ?? {}) }, "waived");

  const { error } = await params.client
    .from("clients")
    .update({
      profile,
      retraction_status: "waived",
      retraction_waived_at: now,
      retraction_ends_at: null,
      product_statut: "IN_DELIVERANCE",
    })
    .eq("id", params.row.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateClientFirstName(params: {
  client: SupabaseClient;
  row: ClientRow;
  firstName: string;
}): Promise<void> {
  const { error } = await params.client
    .from("clients")
    .update({ first_name: params.firstName.trim() })
    .eq("id", params.row.id);

  if (error) {
    throw new Error(error.message);
  }
}
