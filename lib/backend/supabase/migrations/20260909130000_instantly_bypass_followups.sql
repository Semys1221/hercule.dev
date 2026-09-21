-- Extend instantly bypass for Positive Reply Email 2/3 (dashboard-first, no cron).

ALTER TABLE public.instantly_bypass_templates
    DROP CONSTRAINT IF EXISTS instantly_bypass_templates_template_key_check;

ALTER TABLE public.instantly_bypass_templates
    ADD CONSTRAINT instantly_bypass_templates_template_key_check
    CHECK (
        template_key IN (
            'interested_email1',
            'interested_email2',
            'interested_email3',
            'no_reply_email1',
            'no_reply_email2'
        )
    );

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
            'no_reply_email2'
        )
    );

INSERT INTO public.instantly_bypass_templates (template_key, subject, body_html)
VALUES
    (
        'interested_email2',
        'Re: {{subject}}',
        'Bonjour {{first_name}},<br/><br/>Je reviens vers vous suite à votre retour — avez-vous eu le temps d''y réfléchir ?<br/><br/>Bien cordialement'
    ),
    (
        'interested_email3',
        'Re: {{subject}}',
        'Bonjour {{first_name}},<br/><br/>Dernier message de ma part — dites-moi si vous souhaitez qu''on en parle.<br/><br/>Bien cordialement'
    )
ON CONFLICT (template_key) DO NOTHING;
