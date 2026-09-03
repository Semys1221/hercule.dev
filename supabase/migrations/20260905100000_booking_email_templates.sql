-- Editable Resend booking email templates (per category).

CREATE TABLE IF NOT EXISTS public.booking_email_templates (
    category TEXT NOT NULL CHECK (category IN ('agence', 'entreprise')),
    email_type TEXT NOT NULL CHECK (
        email_type IN ('immediate', 'h48_confirm', 'h24_relance')
    ),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (category, email_type)
);

ALTER TABLE public.booking_email_templates ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.booking_email_templates IS
  'Resend booking sequence copy. Edited via Streamlit CRM; used at send time.';

INSERT INTO public.booking_email_templates (category, email_type, subject, body)
VALUES
    (
        'agence',
        'immediate',
        'Confirmation de votre rendez-vous avec Hercule',
        '{{firstNameLine}}

Votre rendez-vous avec Hercule est bien prévu le {{date}} à {{heure}}.

Les informations de connexion vous seront transmises directement par email via Calendly.

Cordialement,'
    ),
    (
        'agence',
        'h48_confirm',
        'Confirmation requise — Votre rendez-vous avec Hercule',
        '{{firstNameLine}}

Nous avons le plaisir de vous informer que les profils présentés lors de votre rendez-vous porteront sur des contrats de conseil financier.

Afin de maintenir votre créneau, merci de confirmer votre présence :
{{confirmUrl}}

Sans confirmation sous 24 heures, votre place pourra être réattribué à une autre agence.

Cordialement,'
    ),
    (
        'agence',
        'h24_relance',
        'Confirmation requise — Votre rendez-vous avec Hercule',
        '{{firstNameLine}}

Nous n''avons pas encore reçu votre confirmation de présence.

Votre créneau sera prochainement libéré dans les heures qui suivent afin de pouvoir être proposé à une autre agence.

Si vous souhaitez maintenir le rendez-vous, merci de nous confirmer votre présence :
{{confirmUrl}}

Cordialement,'
    ),
    (
        'entreprise',
        'immediate',
        'Confirmation de votre rendez-vous avec Hercule',
        '{{firstNameLine}}

Votre rendez-vous avec Hercule est bien prévu le {{date}} à {{heure}}.

Les informations de connexion vous seront transmises directement par email via Calendly.

Cordialement,'
    ),
    (
        'entreprise',
        'h48_confirm',
        'Confirmation requise — Votre rendez-vous avec Hercule',
        '{{firstNameLine}}

Nous avons le plaisir de vous informer que les profils présentés lors de votre rendez-vous porteront sur des contrats de conseil financier.

Afin de maintenir votre créneau, merci de confirmer votre présence :
{{confirmUrl}}

Sans confirmation sous 24 heures, votre place pourra être réattribué à une autre agence.

Cordialement,'
    ),
    (
        'entreprise',
        'h24_relance',
        'Confirmation requise — Votre rendez-vous avec Hercule',
        '{{firstNameLine}}

Nous n''avons pas encore reçu votre confirmation de présence.

Votre créneau sera prochainement libéré dans les heures qui suivent afin de pouvoir être proposé à une autre agence.

Si vous souhaitez maintenir le rendez-vous, merci de nous confirmer votre présence :
{{confirmUrl}}

Cordialement,'
    )
ON CONFLICT (category, email_type) DO NOTHING;
