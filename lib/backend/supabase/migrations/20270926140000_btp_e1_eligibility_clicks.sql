-- Anonymous clicks on shared BTP Interested E1–E3 redirect (no PII).

CREATE TABLE IF NOT EXISTS public.btp_e1_eligibility_clicks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS btp_e1_eligibility_clicks_clicked_at_idx
    ON public.btp_e1_eligibility_clicks (clicked_at DESC);

COMMENT ON TABLE public.btp_e1_eligibility_clicks IS
    'Aggregate click tracking for BTP Interested E1–E3 CTA (shared btp.html URL, no lead slug).';
