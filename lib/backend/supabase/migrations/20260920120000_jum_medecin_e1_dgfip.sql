-- Extend bypass template_key check for médecins généralistes, then seed E1–E3.

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
            'interested_email2',
            'interested_email3',
            'no_show_email1',
            'no_show_email2',
            'pipeline_close'
        )
    );

-- JUM médecins généralistes Interested E1: Famille Marceau / DGFiP / AMF / cotisations / taxe 30–41 %.
INSERT INTO public.instantly_bypass_templates (campaign_id, template_key, subject, body_html)
VALUES (
    '5c142a13-fcdf-4d6d-92e7-2afbc1865a5a',
    'interested_email1_medecin',
    'Re: votre message',
    'Note reçue.<br/><br/>Les cotisations bloquent une partie de vos honoraires, mais plusieurs leviers réglementaires permettent d''intercepter la taxe à 30 % à 41 % avant le prélèvement final.<br/><br/>Pour vérifier si votre structure est éligible aux critères mis en vigueur par la DGFiP, nous validons l''étude de votre dossier lors d''un entretien individuel.<br/><br/>Votre première étude se déroulera à distance avec un consultant agréé par l''AMF.<br/><br/>Réserver votre échange : <a href="{{reservation_jum_link}}">Réserver votre échange</a><br/><br/>Béatrice Meyer<br/>Secrétaire Famille Marceau<br/>Famille Marceau — Bureau Interprofessionnelle de Régulation Fiscale<br/>famillemarceau.fr'
)
ON CONFLICT (campaign_id, template_key) DO UPDATE SET
    subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html,
    updated_at = NOW();

-- Seed E2 / E3 for the medecin campaign if missing.
INSERT INTO public.instantly_bypass_templates (campaign_id, template_key, subject, body_html)
VALUES
    (
        '5c142a13-fcdf-4d6d-92e7-2afbc1865a5a',
        'interested_email2',
        'Re: votre message',
        'Bonjour,<br/><br/>Je reviens vers vous suite à mon précédent message — avez-vous eu l''occasion d''y jeter un œil ?<br/><br/>Si le sujet vous parle, vous pouvez réserver un créneau ici : <a href="{{reservation_jum_link}}">Réserver un créneau</a><br/><br/><i>Répondez non si vous ne souhaitez plus de messages.</i><br/><br/>{{accountSignature}}'
    ),
    (
        '5c142a13-fcdf-4d6d-92e7-2afbc1865a5a',
        'interested_email3',
        'Re: votre message',
        'Bonjour {{first_name}},<br/><br/>N''ayant pas reçu de retour de votre part, je clôture nos échanges ici.<br/><br/>Si le sujet devient pertinent pour vous à l''avenir, vous pourrez simplement revenir vers moi.<br/><br/>Bonne continuation,<br/><br/><i>Répondez non si vous ne souhaitez plus de messages.</i><br/><br/>{{accountSignature}}'
    )
ON CONFLICT (campaign_id, template_key) DO NOTHING;
