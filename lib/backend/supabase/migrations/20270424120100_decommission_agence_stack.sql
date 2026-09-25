-- Decommission agence matching product (data exported pre-drop).
-- Keeps payment/sales_call rows; strips agence/entreprise FK columns.

DELETE FROM public.booking_email_jobs
WHERE lead_category IN ('agence', 'entreprise');

DELETE FROM public.email_sequence_recipients
WHERE lead_category IN ('agence', 'entreprise');

DELETE FROM public.sales_calls
WHERE agence_id IS NOT NULL OR entreprise_id IS NOT NULL;

-- Payments: drop owner FKs to agence/entreprise (historical Stripe rows kept)
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_agence_id_fkey;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_entreprise_id_fkey;
ALTER TABLE public.payments DROP COLUMN IF EXISTS agence_id;
ALTER TABLE public.payments DROP COLUMN IF EXISTS entreprise_id;

ALTER TABLE public.sales_calls DROP CONSTRAINT IF EXISTS sales_calls_agence_id_fkey;
ALTER TABLE public.sales_calls DROP CONSTRAINT IF EXISTS sales_calls_entreprise_id_fkey;
ALTER TABLE public.sales_calls DROP COLUMN IF EXISTS agence_id;
ALTER TABLE public.sales_calls DROP COLUMN IF EXISTS entreprise_id;

-- Recreate owner check without agence/entreprise
ALTER TABLE public.sales_calls DROP CONSTRAINT IF EXISTS sales_calls_owner_check;
ALTER TABLE public.sales_calls
    ADD CONSTRAINT sales_calls_owner_check
    CHECK (
        (comptable_id IS NOT NULL)::int
        + (cif_id IS NOT NULL)::int
        + (comptable_delivery_id IS NOT NULL)::int = 1
    );

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_owner_check;
ALTER TABLE public.payments
    ADD CONSTRAINT payments_owner_check
    CHECK (
        (comptable_id IS NOT NULL)::int
        + (cif_id IS NOT NULL)::int
        + (comptable_delivery_id IS NOT NULL)::int
        + (client_id IS NOT NULL)::int <= 1
    );

DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.agence CASCADE;
DROP TABLE IF EXISTS public.entreprise CASCADE;

-- niche_outreach_config: remove agence niche if present
DELETE FROM public.niche_outreach_config WHERE niche IN ('agence', 'entreprise');
DELETE FROM public.email_variable_bindings WHERE niche IN ('agence', 'entreprise');

ALTER TABLE public.niche_outreach_config
    DROP CONSTRAINT IF EXISTS niche_outreach_config_niche_check;
ALTER TABLE public.niche_outreach_config
    ADD CONSTRAINT niche_outreach_config_niche_check
    CHECK (niche IN ('comptable', 'cif', 'comptable_delivery'));

ALTER TABLE public.email_variable_bindings
    DROP CONSTRAINT IF EXISTS email_variable_bindings_niche_check;
ALTER TABLE public.email_variable_bindings
    ADD CONSTRAINT email_variable_bindings_niche_check
    CHECK (niche IN ('comptable', 'cif', 'comptable_delivery'));
