-- Unified enrollment registry for Management dashboard (outreach / booking / client).

CREATE TABLE IF NOT EXISTS public.email_sequence_recipients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_email text NOT NULL,
    lead_id uuid,
    lead_category text NOT NULL CHECK (lead_category IN ('agence', 'comptable', 'entreprise', 'cif')),
    phase text NOT NULL CHECK (phase IN ('outreach', 'booking', 'client')),
    sequence_slug text NOT NULL,
    provider text NOT NULL CHECK (provider IN ('instantly', 'resend', 'hybrid')),
    status text NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'active', 'paused', 'completed', 'stopped', 'failed')),
    campaign_id text,
    current_step text,
    scheduled_at timestamptz,
    started_at timestamptz,
    paused_at timestamptz,
    completed_at timestamptz,
    stopped_reason text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_sequence_recipients_active_unique
    ON public.email_sequence_recipients (lead_email, lead_category, sequence_slug)
    WHERE status IN ('scheduled', 'active', 'paused');

CREATE INDEX IF NOT EXISTS email_sequence_recipients_niche_phase_status_idx
    ON public.email_sequence_recipients (lead_category, phase, status);

CREATE INDEX IF NOT EXISTS email_sequence_recipients_scheduled_at_idx
    ON public.email_sequence_recipients (scheduled_at)
    WHERE status IN ('scheduled', 'active');

ALTER TABLE public.email_sequence_recipients ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.email_sequence_recipients IS
    'Management dashboard — one row per sequence enrollment (outreach/booking/client).';
