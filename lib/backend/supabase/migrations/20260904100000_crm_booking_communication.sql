-- CRM booking communication: statuses, lead metadata, email job queue.
-- Enum values MEETING_BOOKED / CONFIRMED must be added in a prior statement
-- (see applyCrmBookingCommunicationMigration.ts) before this file runs.

UPDATE public.agence SET statut = 'MEETING_BOOKED' WHERE statut = 'BOOKED';
UPDATE public.entreprise SET statut = 'MEETING_BOOKED' WHERE statut = 'BOOKED';

ALTER TABLE public.agence
    ADD COLUMN IF NOT EXISTS first_name TEXT,
    ADD COLUMN IF NOT EXISTS company TEXT,
    ADD COLUMN IF NOT EXISTS calendly_payload JSONB,
    ADD COLUMN IF NOT EXISTS calendly_questions JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS instantly_confirmed_synced_at TIMESTAMPTZ;

ALTER TABLE public.entreprise
    ADD COLUMN IF NOT EXISTS first_name TEXT,
    ADD COLUMN IF NOT EXISTS company TEXT,
    ADD COLUMN IF NOT EXISTS calendly_payload JSONB,
    ADD COLUMN IF NOT EXISTS calendly_questions JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS instantly_confirmed_synced_at TIMESTAMPTZ;

COMMENT ON COLUMN public.agence.first_name IS 'From Calendly invitee.name or manual CRM entry.';
COMMENT ON COLUMN public.agence.calendly_payload IS 'Raw Calendly webhook/API snapshot.';
COMMENT ON COLUMN public.entreprise.first_name IS 'From Calendly invitee.name or manual CRM entry.';
COMMENT ON COLUMN public.entreprise.calendly_payload IS 'Raw Calendly webhook/API snapshot.';

CREATE TABLE IF NOT EXISTS public.booking_email_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_category TEXT NOT NULL CHECK (lead_category IN ('agence', 'entreprise')),
    lead_id UUID NOT NULL,
    email_type TEXT NOT NULL CHECK (email_type IN ('immediate', 'h48_confirm', 'h24_relance')),
    scheduled_for TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
    resend_email_id TEXT,
    idempotency_key TEXT UNIQUE NOT NULL,
    triggered_by TEXT NOT NULL CHECK (triggered_by IN ('calendly', 'manual', 'retry')),
    sent_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS booking_email_jobs_pending_unique
    ON public.booking_email_jobs (lead_id, email_type)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS booking_email_jobs_due_idx
    ON public.booking_email_jobs (scheduled_for)
    WHERE status = 'pending';

ALTER TABLE public.booking_email_jobs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.booking_email_jobs IS
  'Resend booking sequence jobs. Cron sends pending rows; confirm cancels h24_relance.';
