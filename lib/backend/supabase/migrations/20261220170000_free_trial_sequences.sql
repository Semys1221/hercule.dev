-- Free trial nurture (pre-pay) + free-trial-started (post-pay) for DEC/comptable

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_offer_type_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_offer_type_check
  CHECK (offer_type IN (
    'monthly_1489',
    'pack_989x3',
    'starter_1489_5',
    'starter_998_5',
    'growth_1498_10',
    'monthly_1499',
    'monthly_1499_trial',
    'pack_3x1499',
    'starter_999_5',
    'comptable_acquisition_1489_1m',
    'hercule_liberal_1200_monthly',
    'saas_autonome_10rdv'
  ));

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
    'proposition_ludovic_welcome',
    'proposition_ludovic_config_ready',
    'proposition_ludovic_rdv_reminder',
    'proposition_ludovic_rdv_final',
    'conference_invite',
    'conference_invite_24',
    'conference_invite_48',
    'conference_invite_72',
    'free_trial_1',
    'free_trial_2',
    'free_trial_3',
    'free_trial_started_1',
    'free_trial_started_2',
    'free_trial_started_3'
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
    'proposition_ludovic_welcome',
    'proposition_ludovic_config_ready',
    'proposition_ludovic_rdv_reminder',
    'proposition_ludovic_rdv_final',
    'conference_invite',
    'conference_invite_24',
    'conference_invite_48',
    'conference_invite_72',
    'free_trial_1',
    'free_trial_2',
    'free_trial_3',
    'free_trial_started_1',
    'free_trial_started_2',
    'free_trial_started_3'
  ));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'booking_email_jobs_triggered_by_check'
  ) THEN
    ALTER TABLE public.booking_email_jobs
      DROP CONSTRAINT booking_email_jobs_triggered_by_check;
  END IF;
END $$;

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
    'proposition_ludovic_sequence',
    'cif_conference_sequence',
    'free_trial_sequence',
    'free_trial_started_sequence'
  ));

INSERT INTO public.booking_email_templates (category, email_type, subject, body)
VALUES
    (
        'comptable',
        'free_trial_1',
        'Votre premier rendez-vous visio — offert',
        E'{{firstNameLine}}\n\nAfin de rendre votre décision plus simple, nous allons vous offrir ce qu''aucun service d''acquisition ne fait : votre premier rendez-vous visio sous 7 jours est gratuit.\n\nNous sommes confiants de la qualité — à l''issue, vous renouvellerez pour travailler avec nous.\n\nDémarrez votre essai gratuit 14 jours (puis 1 499 €/mois) :\n{{checkoutTrialLink}}\n\nBéatrice Meyer'
    ),
    (
        'comptable',
        'free_trial_2',
        'Rappel — premier rendez-vous offert',
        E'{{firstNameLine}}\n\nPetit rappel : votre premier rendez-vous visio sous 7 jours est offert pour simplifier votre décision.\n\nEssai 14 jours gratuits, puis 1 499 €/mois. Si vous n''êtes pas convaincu, vous arrêtez.\n\nActiver l''essai :\n{{checkoutTrialLink}}\n\nBéatrice Meyer'
    ),
    (
        'comptable',
        'free_trial_3',
        'Dernière relance — essai gratuit 14 jours',
        E'{{firstNameLine}}\n\nDernière relance : démarrez l''essai gratuit de 14 jours. Votre premier rendez-vous visio est offert sous 7 jours.\n\nEnsuite : 1 499 €/mois. Sans engagement au-delà de l''essai — vous pouvez arrêter.\n\n{{checkoutTrialLink}}\n\nBéatrice Meyer'
    ),
    (
        'comptable',
        'free_trial_started_1',
        'Votre essai a commencé',
        E'{{firstNameLine}}\n\nVotre essai a commencé. Votre premier rendez-vous sera livré sous 14 jours.\n\nSi vous souhaitez vous désabonner ou ne pas renouveler, cliquez ici :\n{{billingPortalLink}}\n\nTableau de bord : {{dashboardLink}}\n\nBéatrice Meyer'
    ),
    (
        'comptable',
        'free_trial_started_2',
        'Opérationnel OK',
        E'{{firstNameLine}}\n\nOpérationnel OK — votre espace essai tourne. Nous préparons votre premier rendez-vous.\n\nTableau de bord : {{dashboardLink}}\n\nBéatrice Meyer'
    ),
    (
        'comptable',
        'free_trial_started_3',
        'Votre premier rendez-vous arrive sous 14 jours',
        E'{{firstNameLine}}\n\nVotre premier rendez-vous arrivera avant 14 jours — tenez-vous prêt !\n\nTableau de bord : {{dashboardLink}}\n\nBéatrice Meyer'
    )
ON CONFLICT (category, email_type) DO UPDATE
SET
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    updated_at = NOW();
