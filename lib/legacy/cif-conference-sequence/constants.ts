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

/** Single cohort session — keep in sync with conference reservation copy. */
export const CONFERENCE_COHORT_SESSION = {
  date: "2026-09-23",
  labelFr: "mercredi 23 septembre",
  labelFrShort: "ce mercredi 23 septembre",
  hourParis: "10h",
  intervalFrom: "10:00",
  intervalTo: "10:30",
  timezone: "Europe/Paris",
} as const;

export const CIF_CONFERENCE_TEST_EMAIL =
  process.env.CIF_CONFERENCE_TEST_EMAIL?.trim().toLowerCase() ||
  "conference-cutover-test@hercule.dev";

/** Fallback when Calendly no longer returns canceled invitees from cutover execute. */
export const CIF_CONFERENCE_CUTOVER_MISSING_EMAILS = [
  "ldescolonges@kacius.fr",
  "crlprtr782@gmail.com",
  "jordan@anato-gp.com",
  "mcolle@cabinet-igc.com",
  "magali@acoeurpatrimoine.fr",
  "lyessnaoui@gmail.com",
  "daniel.droetto@mon-conseil-patrimonial.fr",
  "dduville@champollion-conseils.fr",
  "thomas@mgconseilscourtage.fr",
  "e.bitschene@pc-alsace.fr",
  "2apconseils@gmail.com",
  "aurelia.poher@gmail.com",
  "manon.capelli@capellietassocies.fr",
  "matteo@mdpatrimoineconseils.com",
  "contact@western-accounting.fr",
  "dzelili-naser@outlook.be",
] as const;

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
