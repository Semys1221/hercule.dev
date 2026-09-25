-- Anonymous clicks on shared restaurant E1 eligibility redirect (no PII).

CREATE TABLE IF NOT EXISTS public.restaurant_e1_eligibility_clicks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS restaurant_e1_eligibility_clicks_clicked_at_idx
    ON public.restaurant_e1_eligibility_clicks (clicked_at DESC);

COMMENT ON TABLE public.restaurant_e1_eligibility_clicks IS
    'Aggregate click tracking for restaurant Interested E1 CTA (shared URL, no lead slug).';
