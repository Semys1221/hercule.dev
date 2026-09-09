import type { BookingEmailType } from "./types";

/** Ordered thread families — first type is plain-text root; rest are HTML follow-ups. */
export const SEQUENCE_THREAD_FAMILIES: readonly BookingEmailType[][] = [
  ["immediate", "h48_confirm", "h24_relance"],
  ["role_seq_48", "role_seq_24"],
  ["product_calendly_welcome", "product_calendly_reminder"],
  ["product_payment_welcome"],
  ["upsell_email_1", "upsell_email_2", "upsell_email_3"],
  ["close_indecis_1", "close_indecis_2", "close_indecis_3"],
  ["no_show_indecis_1", "no_show_indecis_2", "no_show_indecis_3"],
  [
    "onboarding_j0",
    "onboarding_j0_bis",
    "onboarding_j1",
    "onboarding_reminder_m10",
    "onboarding_reminder_m5",
    "onboarding_reminder_p5",
  ],
  [
    "deliverance_search_started",
    "deliverance_d7_update",
    "deliverance_milestone",
    "deliverance_waitlist",
  ],
  ["match_proposal", "match_proposal_followup"],
  ["match_booking_agence"],
  ["survey_rdv_entreprise", "survey_rdv_entreprise_followup"],
  ["survey_rdv_agence", "survey_rdv_agence_followup"],
  ["sold_check_j7"],
  ["payment_notification_client"],
  ["modalites_ask", "modalites_cancel"],
  ["modalites_enforce_cancel"],
];

const familyByType = new Map<BookingEmailType, BookingEmailType[]>();

for (const family of SEQUENCE_THREAD_FAMILIES) {
  for (const emailType of family) {
    familyByType.set(emailType, [...family]);
  }
}

export function threadFamilyFor(
  emailType: BookingEmailType,
): BookingEmailType[] | null {
  return familyByType.get(emailType) ?? null;
}

export function sequenceRootTypes(): BookingEmailType[] {
  const roots = new Set<BookingEmailType>();
  for (const family of SEQUENCE_THREAD_FAMILIES) {
    if (family.length > 0) {
      roots.add(family[0]);
    }
  }
  return [...roots];
}

export function isSequenceRoot(emailType: BookingEmailType): boolean {
  const family = threadFamilyFor(emailType);
  return family !== null && family[0] === emailType;
}

export function isSequenceFollowUp(emailType: BookingEmailType): boolean {
  const family = threadFamilyFor(emailType);
  if (!family) {
    return false;
  }
  const idx = family.indexOf(emailType);
  return idx > 0;
}

export function followUpRequiresEmptySubject(emailType: BookingEmailType): boolean {
  return isSequenceFollowUp(emailType);
}

/** Prior sent types in the same thread (excludes the current email). */
export function threadTypesForJob(emailType: BookingEmailType): BookingEmailType[] {
  const family = threadFamilyFor(emailType);
  if (!family) {
    return [];
  }
  const idx = family.indexOf(emailType);
  if (idx <= 0) {
    return [];
  }
  return family.slice(0, idx);
}

export function threadRootType(emailType: BookingEmailType): BookingEmailType | null {
  const family = threadFamilyFor(emailType);
  return family?.[0] ?? null;
}

/** All email types that participate in any thread family. */
export function allThreadedEmailTypes(): BookingEmailType[] {
  return [...familyByType.keys()];
}
