-- Rename JUM outreach niche → comptable_delivery (cabinet delivery leads).

ALTER TABLE public.jum RENAME TO comptable_delivery;

ALTER TABLE public.comptable_delivery
    RENAME COLUMN reservation_jum_link TO reservation_comptable_delivery_link;

ALTER TABLE public.comptable_delivery
    RENAME COLUMN confirmation_jum_link TO confirmation_comptable_delivery_link;

ALTER INDEX IF EXISTS jum_email_lower_idx RENAME TO comptable_delivery_email_lower_idx;
ALTER INDEX IF EXISTS jum_slug_idx RENAME TO comptable_delivery_slug_idx;
ALTER INDEX IF EXISTS jum_statut_idx RENAME TO comptable_delivery_statut_idx;

ALTER TRIGGER jum_set_updated_at ON public.comptable_delivery
    RENAME TO comptable_delivery_set_updated_at;

COMMENT ON TABLE public.comptable_delivery IS
  'Link tracking leads — cabinet delivery outreach (ex-JUM niche).';

ALTER TABLE public.comptable_delivery
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS comptable_delivery_client_id_idx
    ON public.comptable_delivery (client_id)
    WHERE client_id IS NOT NULL;

-- sales_calls.jum_id → comptable_delivery_id
ALTER TABLE public.sales_calls
    RENAME COLUMN jum_id TO comptable_delivery_id;

ALTER INDEX IF EXISTS sales_calls_jum_id_idx RENAME TO sales_calls_comptable_delivery_id_idx;

ALTER TABLE public.sales_calls
    DROP CONSTRAINT IF EXISTS sales_calls_owner_check;

ALTER TABLE public.sales_calls
    ADD CONSTRAINT sales_calls_owner_check
    CHECK (
        (agence_id IS NOT NULL)::int
        + (entreprise_id IS NOT NULL)::int
        + (comptable_id IS NOT NULL)::int
        + (cif_id IS NOT NULL)::int
        + (comptable_delivery_id IS NOT NULL)::int = 1
    );

-- payments.jum_id → comptable_delivery_id
ALTER TABLE public.payments
    RENAME COLUMN jum_id TO comptable_delivery_id;

ALTER INDEX IF EXISTS payments_jum_id_idx RENAME TO payments_comptable_delivery_id_idx;

ALTER TABLE public.payments
    DROP CONSTRAINT IF EXISTS payments_owner_check;

ALTER TABLE public.payments
    ADD CONSTRAINT payments_owner_check
    CHECK (
        (agence_id IS NOT NULL)::int
        + (entreprise_id IS NOT NULL)::int
        + (comptable_id IS NOT NULL)::int
        + (cif_id IS NOT NULL)::int
        + (comptable_delivery_id IS NOT NULL)::int
        + (client_id IS NOT NULL)::int = 1
    );

-- Niche checks: add comptable_delivery, migrate jum rows
ALTER TABLE public.niche_outreach_config
    DROP CONSTRAINT IF EXISTS niche_outreach_config_niche_check;
ALTER TABLE public.niche_outreach_config
    ADD CONSTRAINT niche_outreach_config_niche_check
    CHECK (niche IN ('agence', 'comptable', 'entreprise', 'cif', 'jum', 'comptable_delivery'));

UPDATE public.niche_outreach_config SET niche = 'comptable_delivery' WHERE niche = 'jum';

ALTER TABLE public.niche_outreach_config
    DROP CONSTRAINT IF EXISTS niche_outreach_config_niche_check;
ALTER TABLE public.niche_outreach_config
    ADD CONSTRAINT niche_outreach_config_niche_check
    CHECK (niche IN ('agence', 'comptable', 'entreprise', 'cif', 'comptable_delivery'));

ALTER TABLE public.email_variable_bindings
    DROP CONSTRAINT IF EXISTS email_variable_bindings_niche_check;
ALTER TABLE public.email_variable_bindings
    ADD CONSTRAINT email_variable_bindings_niche_check
    CHECK (niche IN ('agence', 'comptable', 'entreprise', 'cif', 'jum', 'comptable_delivery'));

UPDATE public.email_variable_bindings SET niche = 'comptable_delivery' WHERE niche = 'jum';

ALTER TABLE public.email_variable_bindings
    DROP CONSTRAINT IF EXISTS email_variable_bindings_niche_check;
ALTER TABLE public.email_variable_bindings
    ADD CONSTRAINT email_variable_bindings_niche_check
    CHECK (niche IN ('agence', 'comptable', 'entreprise', 'cif', 'comptable_delivery'));

-- ai_reply_agent / booking_email_threading lead_category if present
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'booking_email_threads'
          AND column_name = 'lead_category'
    ) THEN
        ALTER TABLE public.booking_email_threads
            DROP CONSTRAINT IF EXISTS booking_email_threads_lead_category_check;
        ALTER TABLE public.booking_email_threads
            ADD CONSTRAINT booking_email_threads_lead_category_check
            CHECK (lead_category IN (
                'agence', 'comptable', 'entreprise', 'cif', 'jum', 'comptable_delivery', 'client'
            ));
        UPDATE public.booking_email_threads
        SET lead_category = 'comptable_delivery'
        WHERE lead_category = 'jum';
        ALTER TABLE public.booking_email_threads
            DROP CONSTRAINT IF EXISTS booking_email_threads_lead_category_check;
        ALTER TABLE public.booking_email_threads
            ADD CONSTRAINT booking_email_threads_lead_category_check
            CHECK (lead_category IN (
                'agence', 'comptable', 'entreprise', 'cif', 'comptable_delivery', 'client'
            ));
    END IF;
END $$;

-- Pierre Meniaud delivery client (restaurant + BTP campaigns)
UPDATE public.comptable_delivery
SET client_id = 'b0ebed15-154c-441f-9e7d-3d842bc187cc'::uuid
WHERE client_id IS NULL
  AND instantly_campaign_id IN (
    'e4f11e76-717e-4be9-a6ad-c7f0a331afb7',
    '05bc06f8-4f60-4e6c-bae1-7afe30df38c7'
  );
