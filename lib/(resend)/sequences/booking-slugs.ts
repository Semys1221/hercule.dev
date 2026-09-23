import type { Audience } from "@/lib/legacy/admin/navigation";
import type { BookingEmailType } from "@/lib/legacy/booking-communication/types";

export const BOOKING_SEQUENCE_SLUGS: Record<string, BookingEmailType[]> = {
  "meeting-agence": ["immediate", "h48_confirm", "h24_relance"],
  "meeting-comptable": ["immediate", "h48_confirm", "h24_relance"],
  "meeting-cif": ["immediate", "h48_confirm", "h24_relance"],
  "meeting-jum": ["immediate", "h48_confirm", "h24_relance"],
  "meeting-entreprise": ["immediate", "h48_confirm", "h24_relance"],
  "role-recovery": ["role_seq_48", "role_seq_24"],
  "calendly-seat-onboarding": [
    "product_calendly_welcome",
    "product_calendly_reminder",
  ],
  "payment-welcome": ["product_payment_welcome"],
  "free-trial": ["free_trial_1", "free_trial_2", "free_trial_3"],
  "free-trial-started": [
    "free_trial_started_1",
    "free_trial_started_2",
    "free_trial_started_3",
  ],
  "payment-onboarding": [
    "payment_onboarding_1",
    "payment_onboarding_2",
    "payment_onboarding_3",
    "payment_onboarding_4",
    "payment_onboarding_5",
    "payment_onboarding_6",
    "payment_onboarding_7",
    "payment_onboarding_8",
    "payment_onboarding_9",
  ],
  "comptable-acquisition-post-payment": [
    "comptable_acquisition_welcome",
    "comptable_acquisition_config_ready",
    "comptable_acquisition_rdv_reminder",
    "comptable_acquisition_rdv_final",
  ],
  upsell: ["upsell_email_1", "upsell_email_2", "upsell_email_3"],
  "close-indecis": ["close_indecis_1", "close_indecis_2", "close_indecis_3"],
  "sales-call-no-show": [
    "no_show_indecis_1",
    "no_show_indecis_2",
    "no_show_indecis_3",
  ],
  "onboarding-sequence": [
    "onboarding_retraction_hold",
    "onboarding_j0",
    "onboarding_j0_bis",
    "onboarding_j1",
    "onboarding_reminder_m10",
    "onboarding_reminder_m5",
    "onboarding_reminder_p5",
  ],
  "matching-proposal": ["match_proposal", "match_proposal_followup"],
  "matching-booking": ["match_booking_agence"],
  "entreprise-sold-check": ["sold_check_j7"],
  "notification-payment:agence": ["payment_notification_client"],
  "notification-payment:entreprise": ["payment_notification_client"],
  "post-rdv-survey:agence": ["survey_rdv_agence", "survey_rdv_agence_followup"],
  "post-rdv-survey:entreprise": [
    "survey_rdv_entreprise",
    "survey_rdv_entreprise_followup",
  ],
  "deliverance:agence": [
    "deliverance_search_started",
    "deliverance_d7_update",
    "deliverance_milestone",
    "deliverance_waitlist",
  ],
  "deliverance:entreprise": [
    "deliverance_search_started",
    "deliverance_d7_update",
    "deliverance_milestone",
    "deliverance_waitlist",
  ],
  "deliverance:comptable": [
    "deliverance_search_started",
    "deliverance_d7_update",
    "deliverance_milestone",
    "deliverance_waitlist",
  ],
  "deliverance:cif": [
    "deliverance_search_started",
    "deliverance_d7_update",
    "deliverance_milestone",
    "deliverance_waitlist",
  ],
  "post-rdv-survey:comptable": ["survey_rdv_agence", "survey_rdv_agence_followup"],
  "post-rdv-survey:cif": ["survey_rdv_agence", "survey_rdv_agence_followup"],
};


export function bookingSequenceTypesFor(
  slug: string,
  audience: Audience,
): BookingEmailType[] {
  return (
    BOOKING_SEQUENCE_SLUGS[`${slug}:${audience}`] ??
    BOOKING_SEQUENCE_SLUGS[slug] ??
    []
  );
}
