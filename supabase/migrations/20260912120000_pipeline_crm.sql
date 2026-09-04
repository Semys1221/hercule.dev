-- CRM pipeline: which Hercule follow-up email a lead should receive next.

CREATE TABLE IF NOT EXISTS public.instantly_bypass_pipeline (
    campaign_id TEXT NOT NULL,
    lead_email TEXT NOT NULL,
    step TEXT NOT NULL CHECK (
        step IN ('step_0', 'step_1', 'step_2', 'step_3', 'replies_to_handle')
    ),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (campaign_id, lead_email)
);

CREATE INDEX IF NOT EXISTS instantly_bypass_pipeline_step_idx
    ON public.instantly_bypass_pipeline (campaign_id, step);

ALTER TABLE public.instantly_bypass_pipeline ENABLE ROW LEVEL SECURITY;
