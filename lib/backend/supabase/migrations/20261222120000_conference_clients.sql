-- Conference post-payment clients (DEC · CIF · IAS) + payments FK + Calendly seat extension

CREATE TABLE public.clients (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                           TEXT NOT NULL,
    slug                            TEXT NOT NULL,
    first_name                      TEXT,
    client_type                     TEXT NOT NULL
        CHECK (client_type IN ('dec', 'cif', 'ias')),
    secondary_vertical              TEXT
        CHECK (secondary_vertical IS NULL OR secondary_vertical = 'ias'),
    billing                         TEXT NOT NULL
        CHECK (billing IN ('monthly', 'pack')),
    offer_type                      TEXT NOT NULL,
    rdv_total                       INT NOT NULL DEFAULT 0,
    rdv_used                        INT NOT NULL DEFAULT 0,
    stripe_customer_id              TEXT,
    stripe_subscription_id          TEXT,
    product_statut                  public.product_statut NOT NULL DEFAULT 'NONE',
    onboarding_completed_at         TIMESTAMPTZ,
    retraction_status               TEXT,
    retraction_ends_at              TIMESTAMPTZ,
    retraction_waived_at            TIMESTAMPTZ,
    profile                         JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.clients IS
  'Paying conference clients (DEC · CIF · IAS) — slug auth dashboard /clients/[slug].';

CREATE UNIQUE INDEX clients_slug_idx ON public.clients (slug);
CREATE INDEX clients_email_lower_idx ON public.clients (lower(trim(email)));
CREATE INDEX clients_client_type_idx ON public.clients (client_type);
CREATE INDEX clients_stripe_subscription_id_idx
    ON public.clients (stripe_subscription_id)
    WHERE stripe_subscription_id IS NOT NULL;

CREATE TRIGGER clients_set_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.set_link_tracking_updated_at();

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS payments_client_id_idx ON public.payments (client_id);

ALTER TABLE public.payments
    DROP CONSTRAINT IF EXISTS payments_owner_check;

ALTER TABLE public.payments
    ADD CONSTRAINT payments_owner_check
    CHECK (
        (agence_id IS NOT NULL)::int
        + (entreprise_id IS NOT NULL)::int
        + (comptable_id IS NOT NULL)::int
        + (cif_id IS NOT NULL)::int
        + (jum_id IS NOT NULL)::int
        + (client_id IS NOT NULL)::int = 1
    );

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
        'saas_autonome_10rdv',
        'conference_dec_monthly',
        'conference_dec_pack',
        'conference_cif_monthly',
        'conference_cif_pack',
        'conference_ias_monthly',
        'conference_ias_pack'
    ));

ALTER TABLE public.calendly_seat_onboarding
    ALTER COLUMN agence_id DROP NOT NULL;

ALTER TABLE public.calendly_seat_onboarding
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS calendly_seat_onboarding_client_id_key
    ON public.calendly_seat_onboarding (client_id)
    WHERE client_id IS NOT NULL;

ALTER TABLE public.calendly_seat_onboarding
    DROP CONSTRAINT IF EXISTS calendly_seat_onboarding_owner_check;

ALTER TABLE public.calendly_seat_onboarding
    ADD CONSTRAINT calendly_seat_onboarding_owner_check
    CHECK (
        (agence_id IS NOT NULL)::int + (client_id IS NOT NULL)::int = 1
    );

ALTER TABLE public.booking_email_jobs
    DROP CONSTRAINT IF EXISTS booking_email_jobs_lead_category_check;

ALTER TABLE public.booking_email_jobs
    ADD CONSTRAINT booking_email_jobs_lead_category_check
    CHECK (lead_category IN ('agence', 'comptable', 'entreprise', 'cif', 'jum', 'client'));

ALTER TABLE public.booking_email_templates
    DROP CONSTRAINT IF EXISTS booking_email_templates_category_check;

ALTER TABLE public.booking_email_templates
    ADD CONSTRAINT booking_email_templates_category_check
    CHECK (category IN ('agence', 'comptable', 'entreprise', 'cif', 'jum', 'client'));
