-- Retraction waiver columns on agence + comptable buyer tables.

ALTER TABLE public.agence
  ADD COLUMN IF NOT EXISTS retraction_status TEXT NOT NULL DEFAULT 'n_a',
  ADD COLUMN IF NOT EXISTS retraction_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retraction_waived_at TIMESTAMPTZ;

ALTER TABLE public.comptable
  ADD COLUMN IF NOT EXISTS retraction_status TEXT NOT NULL DEFAULT 'n_a',
  ADD COLUMN IF NOT EXISTS retraction_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retraction_waived_at TIMESTAMPTZ;

ALTER TABLE public.agence
  DROP CONSTRAINT IF EXISTS agence_retraction_status_check;

ALTER TABLE public.agence
  ADD CONSTRAINT agence_retraction_status_check
  CHECK (retraction_status IN ('pending', 'waived', 'expired', 'n_a'));

ALTER TABLE public.comptable
  DROP CONSTRAINT IF EXISTS comptable_retraction_status_check;

ALTER TABLE public.comptable
  ADD CONSTRAINT comptable_retraction_status_check
  CHECK (retraction_status IN ('pending', 'waived', 'expired', 'n_a'));

COMMENT ON COLUMN public.agence.retraction_status IS
  'Commercial retraction hold: pending (4j), waived (client opt-in), expired (auto after ends_at), n_a (entreprise legacy / not applicable).';

COMMENT ON COLUMN public.comptable.retraction_status IS
  'Same retraction hold semantics as agence buyer onboarding.';

-- onboarding_retraction_hold email type
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
        'modalites_enforce_cancel'
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
        'modalites_enforce_cancel'
    ));
