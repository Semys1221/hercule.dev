-- Drop legacy per-niche outreach tables (data lives in public.leads).

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;

UPDATE public.payments
SET lead_id = COALESCE(comptable_id, cif_id, comptable_delivery_id)
WHERE lead_id IS NULL
  AND COALESCE(comptable_id, cif_id, comptable_delivery_id) IS NOT NULL;

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_comptable_id_fkey;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_cif_id_fkey;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_comptable_delivery_id_fkey;
ALTER TABLE public.payments DROP COLUMN IF EXISTS comptable_id;
ALTER TABLE public.payments DROP COLUMN IF EXISTS cif_id;
ALTER TABLE public.payments DROP COLUMN IF EXISTS comptable_delivery_id;

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_owner_check;
ALTER TABLE public.payments
    ADD CONSTRAINT payments_owner_check
    CHECK (
        (lead_id IS NOT NULL)::int + (client_id IS NOT NULL)::int <= 1
    );

ALTER TABLE public.sales_calls
    ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;

UPDATE public.sales_calls
SET lead_id = COALESCE(comptable_id, cif_id, comptable_delivery_id)
WHERE lead_id IS NULL
  AND COALESCE(comptable_id, cif_id, comptable_delivery_id) IS NOT NULL;

ALTER TABLE public.sales_calls DROP CONSTRAINT IF EXISTS sales_calls_comptable_id_fkey;
ALTER TABLE public.sales_calls DROP CONSTRAINT IF EXISTS sales_calls_cif_id_fkey;
ALTER TABLE public.sales_calls DROP CONSTRAINT IF EXISTS sales_calls_comptable_delivery_id_fkey;
ALTER TABLE public.sales_calls DROP COLUMN IF EXISTS comptable_id;
ALTER TABLE public.sales_calls DROP COLUMN IF EXISTS cif_id;
ALTER TABLE public.sales_calls DROP COLUMN IF EXISTS comptable_delivery_id;

ALTER TABLE public.sales_calls DROP CONSTRAINT IF EXISTS sales_calls_owner_check;
ALTER TABLE public.sales_calls
    ADD CONSTRAINT sales_calls_owner_check
    CHECK ((lead_id IS NOT NULL)::int <= 1);

DROP POLICY IF EXISTS leads_service_role_all ON public.leads;
CREATE POLICY leads_service_role_all ON public.leads
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP TABLE IF EXISTS public.comptable_delivery CASCADE;
DROP TABLE IF EXISTS public.comptable CASCADE;
DROP TABLE IF EXISTS public.cif CASCADE;
