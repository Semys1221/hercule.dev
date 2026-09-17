export const CIF_CONFERENCE_KEEPER_EMAILS = [
  "leonardo@cabinet-entrepreneurs.fr",
  "contact@return-invest.com",
  "ludovic.demimuid@eeconseils.fr",
  "mialhe.courtage@groupesofraco.com",
  "tb@bebienpatrimoine.com",
  "contact@obsidione.fr",
] as const;

export const CIF_CONFERENCE_CALENDLY_URL =
  "https://calendly.com/hercule-connect/hercule-briefing-dec-cif";

export const CIF_CONFERENCE_TEST_EMAIL =
  process.env.CIF_CONFERENCE_TEST_EMAIL?.trim().toLowerCase() ||
  "conference-cutover-test@hercule.dev";

export const CONFERENCE_INVITE_EMAIL_TYPES = [
  "conference_invite",
  "conference_invite_24",
  "conference_invite_48",
  "conference_invite_72",
] as const;

export function isConferenceInviteKeeperEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return CIF_CONFERENCE_KEEPER_EMAILS.some(
    (keeper) => keeper.toLowerCase() === normalized,
  );
}

/** Global guard — real cohort sends require explicit env approval. */
export function isConferenceInviteSendEnabled(): boolean {
  return process.env.CONFERENCE_INVITE_SEND_ENABLED?.trim() === "true";
}
