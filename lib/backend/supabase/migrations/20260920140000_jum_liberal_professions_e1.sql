-- Extend bypass template_key / flow checks for liberal professions (kiné, avocat, architecte, vétérinaire).
-- Campaign-specific E1–E3 seeds run via seed-jum-bypass-all after Instantly IDs are known.

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
            'interested_email1_medecin',
            'interested_email1_kine',
            'interested_email1_avocat',
            'interested_email1_architecte',
            'interested_email1_veterinaire',
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
            'interested_email1_medecin',
            'interested_email1_kine',
            'interested_email1_avocat',
            'interested_email1_architecte',
            'interested_email1_veterinaire',
            'interested_email2',
            'interested_email3',
            'no_show_email1',
            'no_show_email2',
            'pipeline_close'
        )
    );

-- Seed segment E1 keys for liberal profession campaigns (DGFiP / JUM Advisory).
-- Primary interested_email1 is also set by seed-jum-bypass-all.
INSERT INTO public.instantly_bypass_templates (campaign_id, template_key, subject, body_html)
VALUES
    (
        '581b9357-753e-4c6e-aa99-d8b36fefca2d',
        'interested_email1_kine',
        'Re: votre message',
        'Bonjour,<br/><br/>Les cotisations bloquent une partie de vos honoraires, mais plusieurs leviers réglementaires permettent de réduire la taxe à 30 % à 41 % avant le prélèvement final.<br/><br/>Pour vérifier si votre cabinet de kinésithérapie est éligible aux critères mis en vigueur par la DGFiP, nous validons l''étude de votre dossier lors d''un entretien individuel.<br/><br/>Votre première étude se déroulera à distance avec un consultant agréé par l''AMF.<br/><br/>Réserver votre échange : <a href="{{reservation_jum_link}}">Réserver votre échange</a><br/><br/>{{accountSignature}}'
    ),
    (
        '273473f0-b2f1-4462-a668-f0277f90d807',
        'interested_email1_avocat',
        'Re: votre message',
        'Bonjour,<br/><br/>Les cotisations bloquent une partie de vos honoraires, mais plusieurs leviers réglementaires permettent de réduire la taxe à 30 % à 41 % avant le prélèvement final.<br/><br/>Pour vérifier si votre cabinet d''avocats est éligible aux critères mis en vigueur par la DGFiP, nous validons l''étude de votre dossier lors d''un entretien individuel.<br/><br/>Votre première étude se déroulera à distance avec un consultant agréé par l''AMF.<br/><br/>Réserver votre échange : <a href="{{reservation_jum_link}}">Réserver votre échange</a><br/><br/>{{accountSignature}}'
    ),
    (
        '7ec0e211-9832-4baf-8803-e12ab93ee517',
        'interested_email1_architecte',
        'Re: votre message',
        'Bonjour,<br/><br/>Les cotisations bloquent une partie de vos honoraires, mais plusieurs leviers réglementaires permettent de réduire la taxe à 30 % à 41 % avant le prélèvement final.<br/><br/>Pour vérifier si votre cabinet d''architecture est éligible aux critères mis en vigueur par la DGFiP, nous validons l''étude de votre dossier lors d''un entretien individuel.<br/><br/>Votre première étude se déroulera à distance avec un consultant agréé par l''AMF.<br/><br/>Réserver votre échange : <a href="{{reservation_jum_link}}">Réserver votre échange</a><br/><br/>{{accountSignature}}'
    ),
    (
        '7300a1ce-9e55-4bfa-92fd-d25361a22a59',
        'interested_email1_veterinaire',
        'Re: votre message',
        'Bonjour,<br/><br/>Les cotisations bloquent une partie de vos honoraires, mais plusieurs leviers réglementaires permettent de réduire la taxe à 30 % à 41 % avant le prélèvement final.<br/><br/>Pour vérifier si votre clinique vétérinaire est éligible aux critères mis en vigueur par la DGFiP, nous validons l''étude de votre dossier lors d''un entretien individuel.<br/><br/>Votre première étude se déroulera à distance avec un consultant agréé par l''AMF.<br/><br/>Réserver votre échange : <a href="{{reservation_jum_link}}">Réserver votre échange</a><br/><br/>{{accountSignature}}'
    )
ON CONFLICT (campaign_id, template_key) DO UPDATE SET
    subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html,
    updated_at = NOW();
