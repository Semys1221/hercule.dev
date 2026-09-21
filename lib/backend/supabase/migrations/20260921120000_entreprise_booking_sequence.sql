-- Entreprise booking sequence: H-48 prep + H-24 reminder copy (replaces copied agence text).

INSERT INTO public.booking_email_templates (category, email_type, subject, body, updated_at)
VALUES
    (
        'entreprise',
        'h48_confirm',
        'Préparez votre rendez-vous avec Hercule',
        '{{firstNameLine}}

Pour préparer au mieux votre rendez-vous, retrouvez ici le déroulé de votre échange :
{{post_booking_link}}',
        NOW()
    ),
    (
        'entreprise',
        'h24_relance',
        'Rappel — Votre rendez-vous avec Hercule approche',
        '{{firstNameLine}}

Votre rendez-vous avec Hercule approche — il est prévu le {{date}} à {{heure}}.

Nous avons hâte d''échanger avec vous.',
        NOW()
    )
ON CONFLICT (category, email_type) DO UPDATE
SET
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    updated_at = EXCLUDED.updated_at;
