-- Comptable Acquisition 1 489 €/mois — Payment Link + post-payment email sequence.

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
        'pack_3x1499',
        'starter_999_5',
        'comptable_acquisition_1489_1m'
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
        'comptable_acquisition_rdv_final'
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
        'comptable_acquisition_rdv_final'
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
        'comptable_acquisition_sequence'
    ));

INSERT INTO public.booking_email_templates (category, email_type, subject, body)
VALUES
    (
        'comptable',
        'comptable_acquisition_welcome',
        'Bienvenue — votre acquisition Hercule est lancée',
        E'{{firstNameLine}}\n\nVotre paiement de 1 489 € pour 1 mois d''acquisition a bien été reçu. Nous lançons votre acquisition dès aujourd''hui.\n\nDHL — votre numéro de suivi : {{trackingNumber}}\nSuivez l''avancement sur votre tableau de bord :\n{{dashboardLink}}\n\nLivrable : environ {{rdvRangeLabel}} rendez-vous planifiés sur octobre et novembre, avec des entrepreneurs (hors professions libérales et indépendants), principalement sur des besoins en comptabilité avec un engagement de 12 mois.\n\nVous recevrez un lien Calendly pour connecter votre agenda sous 24 h. Nous bloquerons les 20 et 30 octobre comme indisponibles.\n\nL''abonnement est automatiquement mis en pause avant que vous ayez reçu un minimum de 10 rendez-vous planifiés.\n\nDe votre côté, aucune démarche particulière : votre Calendly se remplira automatiquement et vous recevrez par email toutes les informations relatives aux rendez-vous.\n\nVos premiers rendez-vous devraient arriver vers le {{estimatedFirstRdvDate}} (environ 25 jours, le temps de mettre en place et lancer les mises en relation).\n\nSi vous n''êtes pas satisfait du premier mois, aucun renouvellement n''est nécessaire le mois suivant.\n\nBéatrice Meyer'
    ),
    (
        'comptable',
        'comptable_acquisition_config_ready',
        'Configuration terminée — connectez votre agenda',
        E'{{firstNameLine}}\n\nLa configuration de votre espace Hercule Comptable est terminée de notre côté.\n\nVous allez recevoir (ou avez reçu) une invitation Calendly pour connecter votre agenda. Une fois connecté, les créneaux se rempliront automatiquement.\n\nNuméro de suivi DHL : {{trackingNumber}}\nTableau de bord : {{dashboardLink}}\n\nBéatrice Meyer'
    ),
    (
        'comptable',
        'comptable_acquisition_rdv_reminder',
        'Rappel — vos premiers rendez-vous arrivent',
        E'{{firstNameLine}}\n\nPetit rappel : vos premiers rendez-vous devraient commencer vers le {{estimatedFirstRdvDate}}.\n\nNuméro de suivi DHL : {{trackingNumber}}\nTableau de bord : {{dashboardLink}}\n\nBéatrice Meyer'
    ),
    (
        'comptable',
        'comptable_acquisition_rdv_final',
        'Dernier rappel automatique — premiers rendez-vous',
        E'{{firstNameLine}}\n\nDernier rappel automatique : vos premiers rendez-vous sont attendus vers le {{estimatedFirstRdvDate}}.\n\nNuméro de suivi DHL : {{trackingNumber}}\nTableau de bord : {{dashboardLink}}\n\nIl s''agit du dernier email automatique de cette séquence. Pour toute question : contact@hercule.dev\n\nBéatrice Meyer'
    )
ON CONFLICT (category, email_type) DO UPDATE
SET
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    updated_at = NOW();
