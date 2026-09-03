-- Update role_seq_24 template copy (consulter link, no urgency paragraph).

UPDATE public.booking_email_templates
SET
    body = '{{firstNameLine}}

J''ai le plaisir de vous confirmer que les contrats d''agence présentés lors de votre entretien concerneront des cabinets de conseil financier situés en région Aquitaine et PACA.

Un aperçu du déroulé de votre entretien est disponible ici : {{confirmLink}}',
    updated_at = NOW()
WHERE category = 'agence' AND email_type = 'role_seq_24';

INSERT INTO public.booking_email_templates (category, email_type, subject, body, updated_at)
VALUES
    (
        'agence',
        'role_seq_24',
        'Confirmer votre créneau — Hercule',
        '{{firstNameLine}}

J''ai le plaisir de vous confirmer que les contrats d''agence présentés lors de votre entretien concerneront des cabinets de conseil financier situés en région Aquitaine et PACA.

Un aperçu du déroulé de votre entretien est disponible ici : {{confirmLink}}',
        NOW()
    )
ON CONFLICT (category, email_type) DO NOTHING;
