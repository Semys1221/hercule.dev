-- Agence web 2: Instantly bypass config + E1–E3 interested subsequence (1 200 € forfait 1er mois).

INSERT INTO public.instantly_bypass_config (
    campaign_id,
    campaign_name,
    webhook_auto_send_enabled,
    pipeline_auto_advance_enabled,
    initialized_at
)
VALUES (
    '6864f739-36ff-4406-89c5-9bee42b8fa21',
    'Agence web 2',
    true,
    true,
    NOW()
)
ON CONFLICT (campaign_id) DO UPDATE SET
    campaign_name = EXCLUDED.campaign_name,
    webhook_auto_send_enabled = EXCLUDED.webhook_auto_send_enabled,
    pipeline_auto_advance_enabled = EXCLUDED.pipeline_auto_advance_enabled,
    updated_at = NOW();

INSERT INTO public.instantly_bypass_templates (campaign_id, template_key, subject, body_html)
VALUES
    (
        '6864f739-36ff-4406-89c5-9bee42b8fa21',
        'interested_email1',
        'Re: question clients',
        'Bonjour,<br/><br/>Les rendez-vous actuellement planifiés sont visibles en pièce jointe.<br/><br/>Il s''agit de PME, de cabinets comptables et de conseillers financiers.<br/><br/>Nous générons actuellement 5 rendez-vous par jour, et 29 rendez-vous sont déjà planifiés.<br/><br/>L''accès illimité au pipeline est proposé à 1 200 € forfaitaires pour le premier mois.<br/><br/>Nous n''acceptons qu''une seule agence.<br/><br/>Pour postuler, répondez mercredi ou jeudi afin que nous puissions vous présenter le Calendly et le fonctionnement du pipeline lors d''un appel en visioconférence.<br/><br/>Cordialement,<br/>{{accountSignature}}'
    ),
    (
        '6864f739-36ff-4406-89c5-9bee42b8fa21',
        'interested_email2',
        'Re: question clients',
        'Bonjour,<br/><br/>Je reviens vers vous sur l''accès au pipeline de rendez-vous visio (PME, cabinets comptables, conseillers financiers).<br/><br/>Nous générons environ 5 rendez-vous par jour — 29 sont déjà planifiés.<br/><br/>L''accès illimité reste à 1 200 € forfaitaires le premier mois. Une seule agence sera retenue.<br/><br/>Êtes-vous disponible mercredi ou jeudi pour un appel visio (présentation Calendly + fonctionnement du pipeline) ?<br/><br/>Répondez simplement avec le jour qui vous convient.<br/><br/>Cordialement,<br/>{{accountSignature}}'
    ),
    (
        '6864f739-36ff-4406-89c5-9bee42b8fa21',
        'interested_email3',
        'Re: question clients',
        'Bonjour {{first_name}},<br/><br/>N''ayant pas reçu de retour de votre part, je clôture ici la candidature pour l''accès au pipeline.<br/><br/>Si le sujet redevient pertinent pour votre agence, vous pourrez simplement répondre à cet email.<br/><br/>Bonne continuation,<br/><br/>{{accountSignature}}'
    )
ON CONFLICT (campaign_id, template_key) DO UPDATE SET
    subject = EXCLUDED.subject,
    body_html = EXCLUDED.body_html,
    updated_at = NOW();
