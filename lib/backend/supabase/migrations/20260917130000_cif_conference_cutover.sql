-- CIF conference cutover: drop confirmation_cif_link, add conference invite email sequence.

ALTER TABLE public.cif
    DROP COLUMN IF EXISTS confirmation_cif_link;

DELETE FROM public.email_variable_bindings
WHERE niche = 'cif'
  AND variable_key = 'confirmation_cif_link';

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
        'onboarding_retraction_hold',
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
        'payment_notification_client',
        'modalites_ask',
        'modalites_cancel',
        'modalites_enforce_cancel',
        'comptable_acquisition_welcome',
        'comptable_acquisition_config_ready',
        'comptable_acquisition_rdv_reminder',
        'comptable_acquisition_rdv_final',
        'conference_invite',
        'conference_invite_24',
        'conference_invite_48',
        'conference_invite_72'
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
        'onboarding_retraction_hold',
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
        'payment_notification_client',
        'modalites_ask',
        'modalites_cancel',
        'modalites_enforce_cancel',
        'comptable_acquisition_welcome',
        'comptable_acquisition_config_ready',
        'comptable_acquisition_rdv_reminder',
        'comptable_acquisition_rdv_final',
        'conference_invite',
        'conference_invite_24',
        'conference_invite_48',
        'conference_invite_72'
    ));

ALTER TABLE public.booking_email_jobs
    DROP CONSTRAINT IF EXISTS booking_email_jobs_triggered_by_check;

ALTER TABLE public.booking_email_jobs
    ADD CONSTRAINT booking_email_jobs_triggered_by_check
    CHECK (triggered_by IN (
        'calendly',
        'manual',
        'retry',
        'role_recovery',
        'stripe_payment',
        'calendly_seat_cron',
        'onboarding_complete',
        'sales_call_completed',
        'sales_call_not_paid',
        'sales_call_no_show',
        'onboarding_sequence',
        'admin_match',
        'calendly_match_booking',
        'cron_rdv_survey',
        'cron_sold_check',
        'stripe_payment_notification',
        'deliverance_admin',
        'admin_complete_appt',
        'admin_modalites',
        'comptable_acquisition_sequence',
        'cif_conference_sequence'
    ));

INSERT INTO public.booking_email_templates (category, email_type, subject, body)
VALUES
    (
        'cif',
        'conference_invite',
        'Invitation — conférence Hercule (mercredi 10h)',
        E'{{firstNameLine}}\n\nLe volume de demandes d''audit CIF/DEC dépasse notre capacité en rendez-vous individuels.\n\nNous organisons une conférence collective en visio — chaque mercredi à 10h (heure de Paris) — pour présenter la méthode Hercule et répondre à vos questions sur le déploiement du système inbound sur votre zone.\n\nInscription (gratuite) :\n\nDévelopper ma clientèle professionnelle\n{{reservation_cif_link}}\n\nBéatrice Meyer'
    ),
    (
        'cif',
        'conference_invite_24',
        'Rappel — prochaine conférence Hercule mercredi 10h',
        E'{{firstNameLine}}\n\nPetit rappel : la prochaine conférence Hercule CIF a lieu mercredi à 10h (heure de Paris).\n\nInscription :\n\nDévelopper ma clientèle professionnelle\n{{reservation_cif_link}}\n\nBéatrice Meyer'
    ),
    (
        'cif',
        'conference_invite_48',
        'Dernière place — conférence Hercule mercredi 10h',
        E'{{firstNameLine}}\n\nNous vous réservons encore une place pour la conférence collective de mercredi à 10h (heure de Paris) — présentation de la méthode Hercule et échanges sur votre zone.\n\nInscription :\n\nDévelopper ma clientèle professionnelle\n{{reservation_cif_link}}\n\nBéatrice Meyer'
    ),
    (
        'cif',
        'conference_invite_72',
        'Clôture — conférence Hercule',
        E'{{firstNameLine}}\n\nDernier message automatique de notre part : si vous souhaitez découvrir le système Hercule pour cabinets CIF, la conférence du mercredi à 10h (heure de Paris) reste ouverte :\n\nDévelopper ma clientèle professionnelle\n{{reservation_cif_link}}\n\nSinon, nous clôturons ce fil. Répondez à cet email si vous souhaitez être recontacté plus tard.\n\nBéatrice Meyer'
    )
ON CONFLICT (category, email_type) DO UPDATE
SET subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    updated_at = NOW();
