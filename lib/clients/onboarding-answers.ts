import { parseClientVideoConference, videoConferenceLabel } from "@/lib/clients/video-conference";
import type { ClientRow } from "@/lib/clients/types";

export type ClientOnboardingAnswers = {
  firstName: string | null;
  videoConference: string | null;
  startNow: boolean | null;
  unavailability: string | null;
  cgvVersion: string | null;
  cgvAcceptedAt: string | null;
  dashboardPath: string;
};

function profileString(
  profile: Record<string, unknown> | null,
  key: string,
): string | null {
  const value = profile?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function readClientOnboardingAnswers(
  row: Pick<ClientRow, "first_name" | "profile" | "slug">,
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
    dashboardPath: `/clients/${encodeURIComponent(row.slug)}`,
  };
}
