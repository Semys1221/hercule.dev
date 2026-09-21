-- Extend sales_calls to support cabinet comptable leads (entreprise table).
-- At least one of agence_id / entreprise_id must be set.

ALTER TABLE public.sales_calls
    ADD COLUMN IF NOT EXISTS entreprise_id UUID REFERENCES public.entreprise(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS sales_calls_entreprise_id_idx ON public.sales_calls (entreprise_id);

ALTER TABLE public.sales_calls
    DROP CONSTRAINT IF EXISTS sales_calls_owner_check;

ALTER TABLE public.sales_calls
    ADD CONSTRAINT sales_calls_owner_check
    CHECK (agence_id IS NOT NULL OR entreprise_id IS NOT NULL);

COMMENT ON COLUMN public.sales_calls.entreprise_id IS
    'FK to entreprise lead (cabinet comptable / funnel audience comptable).';
