-- Extend payments table to support cabinet comptable leads (entreprise table).
-- agence_id becomes nullable; at least one of agence_id / entreprise_id must be set.

-- 1. Remove NOT NULL on agence_id (was NOT NULL REFERENCES agence ON DELETE CASCADE)
ALTER TABLE public.payments
    ALTER COLUMN agence_id DROP NOT NULL;

-- 2. Add entreprise_id (nullable FK)
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS entreprise_id UUID REFERENCES public.entreprise(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS payments_entreprise_id_idx ON public.payments (entreprise_id);

-- 3. Ensure at least one owner is set
ALTER TABLE public.payments
    DROP CONSTRAINT IF EXISTS payments_owner_check;
ALTER TABLE public.payments
    ADD CONSTRAINT payments_owner_check
    CHECK (agence_id IS NOT NULL OR entreprise_id IS NOT NULL);

-- 4. Extend offer_type accepted values
--    (offer_type is TEXT with no CHECK in original migration — add one if absent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.payments'::regclass
          AND conname = 'payments_offer_type_check'
    ) THEN
        ALTER TABLE public.payments
            ADD CONSTRAINT payments_offer_type_check
            CHECK (offer_type IN (
                'monthly_1489',
                'pack_989x3',
                'monthly_1499',
                'pack_3x1499'
            ));
    ELSE
        ALTER TABLE public.payments
            DROP CONSTRAINT payments_offer_type_check;
        ALTER TABLE public.payments
            ADD CONSTRAINT payments_offer_type_check
            CHECK (offer_type IN (
                'monthly_1489',
                'pack_989x3',
                'monthly_1499',
                'pack_3x1499'
            ));
    END IF;
END;
$$;

-- 5. Update table comment
COMMENT ON TABLE public.payments IS
  'Stripe checkout records for agence and comptable product offers.';
COMMENT ON COLUMN public.payments.agence_id IS
  'Set for agence (Web/Tech) offers. Null for comptable offers.';
COMMENT ON COLUMN public.payments.entreprise_id IS
  'Set for comptable offers. Null for agence offers.';
