-- Sales call no-show sequence: dedicated email types (reservation link CTA).

ALTER TABLE public.booking_email_jobs
    DROP CONSTRAINT IF EXISTS booking_email_jobs_email_type_check;

ALTER TABLE public.booking_email_jobs
    ADD CONSTRAINT booking_email_jobs_email_type_check
    CHECK (email_type IN (
        'immediate',
        'h48_confirm',
        'h24_relance',
        'h20_cancel',
        'role_seq_48',
        'role_seq_24',
        'product_calendly_welcome',
        'product_calendly_reminder',
        'product_payment_welcome',
        'upsell_email_1',
        'upsell_email_2',
        'upsell_email_3',
        'close_indecis_1',
        'close_indecis_2',
        'close_indecis_3',
        'no_show_indecis_1',
        'no_show_indecis_2',
        'no_show_indecis_3',
        'onboarding_j0',
        'onboarding_j0_bis',
        'onboarding_j1',
        'onboarding_reminder_m10',
        'onboarding_reminder_m5',
        'onboarding_reminder_p5',
        'deliverance_search_started',
        'deliverance_d7_update',
        'deliverance_milestone',
        'deliverance_waitlist',
        'match_proposal',
        'match_proposal_followup',
        'match_booking_agence',
        'survey_rdv_entreprise',
        'survey_rdv_entreprise_followup',
        'survey_rdv_agence',
        'survey_rdv_agence_followup',
        'sold_check_j7',
        'payment_notification_client'
    ));

ALTER TABLE public.booking_email_templates
    DROP CONSTRAINT IF EXISTS booking_email_templates_email_type_check;

ALTER TABLE public.booking_email_templates
    ADD CONSTRAINT booking_email_templates_email_type_check
    CHECK (email_type IN (
        'immediate',
        'h48_confirm',
        'h24_relance',
        'h20_cancel',
        'role_seq_48',
        'role_seq_24',
        'product_calendly_welcome',
        'product_calendly_reminder',
        'product_payment_welcome',
        'upsell_email_1',
        'upsell_email_2',
        'upsell_email_3',
        'close_indecis_1',
        'close_indecis_2',
        'close_indecis_3',
        'no_show_indecis_1',
        'no_show_indecis_2',
        'no_show_indecis_3',
        'onboarding_j0',
        'onboarding_j0_bis',
        'onboarding_j1',
        'onboarding_reminder_m10',
        'onboarding_reminder_m5',
        'onboarding_reminder_p5',
        'deliverance_search_started',
        'deliverance_d7_update',
        'deliverance_milestone',
        'deliverance_waitlist',
        'match_proposal',
        'match_proposal_followup',
        'match_booking_agence',
        'survey_rdv_entreprise',
        'survey_rdv_entreprise_followup',
        'survey_rdv_agence',
        'survey_rdv_agence_followup',
        'sold_check_j7',
        'payment_notification_client'
    ));
