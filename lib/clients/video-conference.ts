export const CLIENT_VIDEO_CONFERENCE_OPTIONS = [
  "zoom_pro",
  "google_meet_pro",
  "microsoft_teams_pro",
] as const;

export type ClientVideoConference = (typeof CLIENT_VIDEO_CONFERENCE_OPTIONS)[number];

const VIDEO_CONFERENCE_LABELS: Record<ClientVideoConference, string> = {
  zoom_pro: "Zoom Pro",
  google_meet_pro: "Google Meet Pro",
  microsoft_teams_pro: "Microsoft Teams Pro",
};

const VIDEO_CONFERENCE_DESCRIPTIONS: Record<ClientVideoConference, string> = {
  zoom_pro: "Je souhaite un compte Zoom Pro fourni par Hercule",
  google_meet_pro: "J'ai déjà un compte Google Meet Pro",
  microsoft_teams_pro: "J'ai déjà un compte Microsoft Teams Pro",
};

export function isClientVideoConference(value: unknown): value is ClientVideoConference {
  return (
    typeof value === "string" &&
    (CLIENT_VIDEO_CONFERENCE_OPTIONS as readonly string[]).includes(value)
  );
}

export function parseClientVideoConference(
  profile: Record<string, unknown> | null | undefined,
): ClientVideoConference | null {
  const raw = profile?.video_conference;
  return isClientVideoConference(raw) ? raw : null;
}

export function videoConferenceLabel(value: ClientVideoConference | null | undefined): string {
  if (!value) return "En attente";
  return VIDEO_CONFERENCE_LABELS[value];
}

export function videoConferenceDescription(value: ClientVideoConference): string {
  return VIDEO_CONFERENCE_DESCRIPTIONS[value];
}

export function videoConferenceOpsAction(value: ClientVideoConference): string {
  if (value === "zoom_pro") {
    return "Provisionner un compte Zoom Pro pour ce client.";
  }
  return "Utiliser le compte visio existant du client (pas de provisionnement Zoom).";
}
