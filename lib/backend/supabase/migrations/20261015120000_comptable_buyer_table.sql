-- Comptable buyer table (cabinet acquisition) + FK extensions for new rows only.
-- No backfill — legacy cabinet leads remain on entreprise.

-- Prerequisite: payments must support entreprise_id (20261010120000 may be missing on some envs)
ALTER TABLE public.payments
    ALTER COLUMN agence_id DROP NOT NULL;

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS entreprise_id UUID REFERENCES public.entreprise(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS payments_entreprise_id_idx ON public.payments (entreprise_id);

CREATE TABLE public.comptable (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                           TEXT NOT NULL,
    statut                          public.lead_statut NOT NULL DEFAULT 'NOTBOOKED',
    slug                            TEXT NOT NULL,
    instantly_lead_id               TEXT,
    instantly_campaign_id           TEXT,
    calendly_invitee_uri            TEXT,
    booked_at                       TIMESTAMPTZ,
    instantly_synced_at             TIMESTAMPTZ,
    first_name                      TEXT,
    company                         TEXT,
    calendly_payload                JSONB,
    calendly_questions              JSONB NOT NULL DEFAULT '{}'::jsonb,
    scheduled_at                    TIMESTAMPTZ,
    confirmed_at                    TIMESTAMPTZ,
    instantly_confirmed_synced_at   TIMESTAMPTZ,
    calendly_join_url                TEXT,
    calendly_reschedule_url         TEXT,
    calendly_cancel_url             TEXT,
    calendly_links_synced_at        TIMESTAMPTZ,
    calendly_links_sync_error       TEXT,
    reservation_comptable_link      TEXT NOT NULL,
    confirmation_comptable_link     TEXT NOT NULL,
    dashboard_link                  TEXT,
    product_statut                  public.product_statut NOT NULL DEFAULT 'NONE',
    onboarding_completed_at         TIMESTAMPTZ,
    profile                         JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.comptable IS
  'Link tracking leads — cabinet comptable buyer niche. statut NOTBOOKED until Calendly booking.';
COMMENT ON COLUMN public.comptable.slug IS
  'Unique URL slug passed as Calendly utm_content. Not a full URL.';
COMMENT ON COLUMN public.comptable.reservation_comptable_link IS
  'Full booking URL for comptable outreach sequences.';
COMMENT ON COLUMN public.comptable.confirmation_comptable_link IS
  'Full confirm URL for comptable Resend/Instantly sequences.';
COMMENT ON COLUMN public.comptable.profile IS
  'Central lead profile JSON — form, communication.delays, display.timeline.';

CREATE UNIQUE INDEX comptable_email_lower_idx ON public.comptable (lower(trim(email)));
CREATE UNIQUE INDEX comptable_slug_idx ON public.comptable (slug);
CREATE INDEX comptable_statut_idx ON public.comptable (statut);

CREATE INDEX comptable_calendly_links_unsynced_idx
    ON public.comptable (calendly_links_synced_at)
    WHERE statut IN ('MEETING_BOOKED', 'CONFIRMED', 'BOOKED')
      AND calendly_links_synced_at IS NULL
      AND calendly_invitee_uri IS NOT NULL;

CREATE TRIGGER comptable_set_updated_at
    BEFORE UPDATE ON public.comptable
    FOR EACH ROW EXECUTE FUNCTION public.set_link_tracking_updated_at();

ALTER TABLE public.comptable ENABLE ROW LEVEL SECURITY;

-- sales_calls: add comptable_id + exactly-one owner
ALTER TABLE public.sales_calls
    ADD COLUMN IF NOT EXISTS comptable_id UUID REFERENCES public.comptable(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS sales_calls_comptable_id_idx ON public.sales_calls (comptable_id);

ALTER TABLE public.sales_calls
    DROP CONSTRAINT IF EXISTS sales_calls_owner_check;

ALTER TABLE public.sales_calls
    ADD CONSTRAINT sales_calls_owner_check
    CHECK (
        (agence_id IS NOT NULL)::int
        + (entreprise_id IS NOT NULL)::int
        + (comptable_id IS NOT NULL)::int = 1
    );

COMMENT ON COLUMN public.sales_calls.entreprise_id IS
    'FK to entreprise lead (TPE web matching matter). Legacy cabinet rows may remain.';

COMMENT ON COLUMN public.sales_calls.comptable_id IS
    'FK to comptable lead (cabinet buyer niche).';

-- payments: add comptable_id + exactly-one owner
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS comptable_id UUID REFERENCES public.comptable(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS payments_comptable_id_idx ON public.payments (comptable_id);

ALTER TABLE public.payments
    DROP CONSTRAINT IF EXISTS payments_owner_check;

ALTER TABLE public.payments
    ADD CONSTRAINT payments_owner_check
    CHECK (
        (agence_id IS NOT NULL)::int
        + (entreprise_id IS NOT NULL)::int
        + (comptable_id IS NOT NULL)::int = 1
    );

COMMENT ON COLUMN public.payments.entreprise_id IS
    'Legacy comptable checkout rows. New comptable payments use comptable_id.';
COMMENT ON COLUMN public.payments.comptable_id IS
    'Set for comptable (cabinet) offers. Null for agence offers.';

COMMENT ON TABLE public.payments IS
  'Stripe checkout records for agence, comptable, and legacy entreprise comptable offers.';

-- booking_email_jobs: extend lead_category
ALTER TABLE public.booking_email_jobs
    DROP CONSTRAINT IF EXISTS booking_email_jobs_lead_category_check;

ALTER TABLE public.booking_email_jobs
    ADD CONSTRAINT booking_email_jobs_lead_category_check
    CHECK (lead_category IN ('agence', 'comptable', 'entreprise'));

-- booking_email_templates: extend category
ALTER TABLE public.booking_email_templates
    DROP CONSTRAINT IF EXISTS booking_email_templates_category_check;

ALTER TABLE public.booking_email_templates
    ADD CONSTRAINT booking_email_templates_category_check
    CHECK (category IN ('agence', 'comptable', 'entreprise'));
