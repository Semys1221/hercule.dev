import { parseClientVideoConference, videoConferenceLabel } from "@/lib/clients/video-conference";
import type { ClientRow } from "@/lib/clients/types";

export type ClientOnboardingAnswers = {
  firstName: string | null;
  videoConference: string | null;
  startNow: boolean | null;
  unavailability: string | null;
  cgvVersion: string | null;
  cgvAcceptedAt: string | null;
  onboardingCompletedAt: string | null;
  retractionChoice: string | null;
  dashboardPath: string;
};

export type ClientOnboardingAnswersRow = Pick<
  ClientRow,
  | "first_name"
  | "profile"
  | "slug"
  | "onboarding_completed_at"
  | "retraction_status"
  | "retraction_ends_at"
  | "retraction_waived_at"
>;

function profileString(
  profile: Record<string, unknown> | null,
  key: string,
): string | null {
  const value = profile?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function retractionChoiceLabel(row: ClientOnboardingAnswersRow): string | null {
  const status = row.retraction_status?.trim();
  if (status === "waived") {
    return "Démarrage immédiat — rétractation levée";
  }
  if (status === "pending") {
    const ends = row.retraction_ends_at?.trim();
    return ends
      ? `Délai de rétractation jusqu’au ${new Date(ends).toLocaleDateString("fr-FR")}`
      : "Délai de rétractation en cours";
  }
  const startRaw = row.profile?.start_now;
  if (typeof startRaw === "boolean") {
    return startRaw
      ? "Démarrage immédiat demandé"
      : "Attente du délai de rétractation";
  }
  return null;
}

export function readClientOnboardingAnswers(
  row: ClientOnboardingAnswersRow,
): ClientOnboardingAnswers {
  const profile = row.profile;
  const video = parseClientVideoConference(profile);
  const startRaw = profile?.start_now;
  return {
    firstName: row.first_name?.trim() || null,
    videoConference: video ? videoConferenceLabel(video) : null,
    startNow: typeof startRaw === "boolean" ? startRaw : null,
    unavailability: profileString(profile, "unavailability"),
    cgvVersion: profileString(profile, "cgv_accepted_version"),
    cgvAcceptedAt: profileString(profile, "cgv_accepted_at"),
    onboardingCompletedAt: row.onboarding_completed_at?.trim() || null,
    retractionChoice: retractionChoiceLabel(row),
    dashboardPath: `/clients/${encodeURIComponent(row.slug)}`,
  };
}
