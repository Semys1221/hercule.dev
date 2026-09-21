-- Product email sequences: new email types, triggers, matches table.

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
        'onboarding_sequence',
        'admin_match',
        'calendly_match_booking',
        'cron_rdv_survey',
        'cron_sold_check',
        'stripe_payment_notification',
        'deliverance_admin'
    ));

ALTER TABLE public.entreprise
    ADD COLUMN IF NOT EXISTS product_statut public.product_statut NOT NULL DEFAULT 'NONE';

CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agence_id UUID NOT NULL REFERENCES public.agence(id) ON DELETE CASCADE,
    entreprise_id UUID NOT NULL REFERENCES public.entreprise(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'proposed'
        CHECK (status IN ('proposed', 'booked', 'sold')),
    calendly_url TEXT,
    proposal_sent_at TIMESTAMPTZ,
    followup_sent_at TIMESTAMPTZ,
    booking_at TIMESTAMPTZ,
    surveys_sent_at TIMESTAMPTZ,
    agence_survey_token TEXT UNIQUE,
    entreprise_survey_token TEXT UNIQUE,
    agence_survey_responded_at TIMESTAMPTZ,
    entreprise_survey_responded_at TIMESTAMPTZ,
    sale_made BOOLEAN,
    search_started_at TIMESTAMPTZ,
    meeting_duration_minutes INT NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS matches_agence_id_idx ON public.matches (agence_id);
CREATE INDEX IF NOT EXISTS matches_entreprise_id_idx ON public.matches (entreprise_id);
CREATE INDEX IF NOT EXISTS matches_status_idx ON public.matches (status);
