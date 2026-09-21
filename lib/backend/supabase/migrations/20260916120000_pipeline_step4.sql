-- Pipeline step_4 (closed / Not Interested) and per-campaign auto-advance toggle.

ALTER TABLE public.instantly_bypass_pipeline
    DROP CONSTRAINT IF EXISTS instantly_bypass_pipeline_step_check;

ALTER TABLE public.instantly_bypass_pipeline
    ADD CONSTRAINT instantly_bypass_pipeline_step_check
    CHECK (
        step IN (
            'step_0',
            'step_1',
            'step_2',
            'step_3',
            'step_4',
            'replies_to_handle'
        )
    );

ALTER TABLE public.instantly_bypass_config
    ADD COLUMN IF NOT EXISTS pipeline_auto_advance_enabled BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.instantly_bypass_config.pipeline_auto_advance_enabled IS
  'Per-campaign toggle for cron auto-advance E2/E3 and step_4 close.';

ALTER TABLE public.instantly_bypass_events
    DROP CONSTRAINT IF EXISTS instantly_bypass_events_flow_check;

ALTER TABLE public.instantly_bypass_events
    ADD CONSTRAINT instantly_bypass_events_flow_check
    CHECK (
        flow IN (
            'interested_email1',
            'interested_email2',
            'interested_email3',
            'no_reply_email1',
            'no_reply_email2',
            'no_show_email1',
            'no_show_email2',
            'pipeline_close'
        )
    );
