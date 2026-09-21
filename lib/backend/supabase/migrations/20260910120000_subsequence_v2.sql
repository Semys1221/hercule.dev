-- Subsequence v2: no_show flows, final template copy, interest-status fetch model.

ALTER TABLE public.instantly_bypass_templates
    DROP CONSTRAINT IF EXISTS instantly_bypass_templates_template_key_check;

ALTER TABLE public.instantly_bypass_events
    DROP CONSTRAINT IF EXISTS instantly_bypass_events_flow_check;

UPDATE public.instantly_bypass_templates
SET template_key = 'no_show_email1'
WHERE template_key = 'no_reply_email1';

UPDATE public.instantly_bypass_templates
SET template_key = 'no_show_email2'
WHERE template_key = 'no_reply_email2';

UPDATE public.instantly_bypass_events
SET flow = 'no_show_email1'
WHERE flow = 'no_reply_email1';

UPDATE public.instantly_bypass_events
SET flow = 'no_show_email2'
WHERE flow = 'no_reply_email2';

ALTER TABLE public.instantly_bypass_templates
    ADD CONSTRAINT instantly_bypass_templates_template_key_check
    CHECK (
        template_key IN (
            'interested_email1',
            'interested_email2',
            'interested_email3',
            'no_show_email1',
            'no_show_email2'
        )
    );

ALTER TABLE public.instantly_bypass_events
    ADD CONSTRAINT instantly_bypass_events_flow_check
    CHECK (
        flow IN (
            'interested_email1',
            'interested_email2',
            'interested_email3',
            'no_show_email1',
            'no_show_email2'
        )
    );

INSERT INTO public.instantly_bypass_templates (template_key, subject, body_html)
VALUES
    (
        'interested_email1',
        '',
        'Voici les précisions.<br/><br/>L''un des groupes de clients que nous avons actuellement est constitué de cabinets comptables de 3 à 12 mandataires, disposant d''un budget mensuel dédié au développement marketing.<br/><br/>L''expertise recherchée porte sur l''acquisition organique et/ou payante.<br/><br/>Les premiers échanges entre cabinets et agences marketing sont disponibles du 8 au 27 septembre.<br/><br/>Pour réaliser l''audit de compatibilité de votre agence, cliquez ici :<br/><a href="{{reservation_agence_link}}">Mon agence est compatible</a><br/><br/>Pour comprendre nos modalités et la qualification des demandes :<br/><a href="https://hercule.dev">hercule.dev</a><br/><br/>Cordialement,<br/>{{accountSignature}}'
    ),
    (
        'interested_email2',
        '',
        'Merci de me confirmer que votre réservation Calendly a bien été effectuée.<br/><br/>Nos demandes doivent être pourvues entre le 8 et le 27 septembre.<br/><br/>Sans confirmation de votre part, nous pourrons proposer cette candidature à une autre entreprise.<br/><br/><a href="{{reservation_agence_link}}">Demander un audit</a><br/><br/>{{accountSignature}}<br/><a href="https://hercule.dev">hercule.dev</a>'
    ),
    (
        'interested_email3',
        '',
        'Sans demande de votre part, nous devons vous retirer de notre liste afin de proposer ces projets à une autre agence web.<br/><br/>Merci de votre compréhension.<br/><br/>{{accountSignature}}<br/><a href="https://hercule.dev">hercule.dev</a>'
    ),
    (
        'no_show_email1',
        '',
        'Merci de me confirmer si votre réservation Calendly a bien été effectuée.<br/><br/>Nos demandes doivent être pourvues dès la mi-septembre.<br/><br/>Sans confirmation de votre part, nous proposerons cette candidature à une autre agence web.<br/><br/><a href="{{reservation_agence_link}}">Demandez l''audit de votre agence</a><br/><br/>Cordialement,<br/>{{accountSignature}}<br/><a href="https://hercule.dev">hercule.dev</a>'
    ),
    (
        'no_show_email2',
        '',
        'N''ayant reçu aucune confirmation de votre part, nous devons retirer votre agence.<br/><br/>Cordialement,<br/>{{accountSignature}}<br/><a href="https://hercule.dev">hercule.dev</a>'
    )
ON CONFLICT (template_key) DO UPDATE
SET
    subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html,
    updated_at = NOW();
