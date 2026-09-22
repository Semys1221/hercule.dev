-- Round-robin booking: first lead date + Calendly URL per client,
-- sticky assignment from comptable/cif leads.

ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS first_lead_at TIMESTAMPTZ;

UPDATE public.clients
SET first_lead_at = created_at + INTERVAL '20 days'
WHERE first_lead_at IS NULL;

ALTER TABLE public.clients
    ALTER COLUMN first_lead_at SET DEFAULT (NOW() + INTERVAL '20 days');

ALTER TABLE public.clients
    ALTER COLUMN first_lead_at SET NOT NULL;

ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS calendly_scheduling_url TEXT;

COMMENT ON COLUMN public.clients.first_lead_at IS
    'First delivery date (signup + 20 days). Gate for round-robin eligibility.';
COMMENT ON COLUMN public.clients.calendly_scheduling_url IS
    'Client Calendly scheduling URL embedded on /reservation/[slug]. Required to enter the RR pool.';

ALTER TABLE public.comptable
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

ALTER TABLE public.cif
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS comptable_client_id_idx
    ON public.comptable (client_id)
    WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS cif_client_id_idx
    ON public.cif (client_id)
    WHERE client_id IS NOT NULL;
