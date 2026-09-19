-- Allow JUM segment-specific interested E1 template keys.

ALTER TABLE public.instantly_bypass_templates
    DROP CONSTRAINT IF EXISTS instantly_bypass_templates_template_key_check;

ALTER TABLE public.instantly_bypass_templates
    ADD CONSTRAINT instantly_bypass_templates_template_key_check
    CHECK (
        template_key IN (
            'interested_email1',
            'interested_email1_restaurant',
            'interested_email1_b2b',
            'interested_email1_dentiste',
            'interested_email2',
            'interested_email3',
            'no_show_email1',
            'no_show_email2'
        )
    );

ALTER TABLE public.instantly_bypass_events
    DROP CONSTRAINT IF EXISTS instantly_bypass_events_flow_check;

ALTER TABLE public.instantly_bypass_events
    ADD CONSTRAINT instantly_bypass_events_flow_check
    CHECK (
        flow IN (
            'interested_email1',
            'interested_email1_restaurant',
            'interested_email1_b2b',
            'interested_email1_dentiste',
            'interested_email2',
            'interested_email3',
            'no_show_email1',
            'no_show_email2',
            'pipeline_close'
        )
    );
