-- H-20 cancellation email type (agence only).

ALTER TABLE public.booking_email_jobs
    DROP CONSTRAINT IF EXISTS booking_email_jobs_email_type_check;

ALTER TABLE public.booking_email_jobs
    ADD CONSTRAINT booking_email_jobs_email_type_check
    CHECK (email_type IN ('immediate', 'h48_confirm', 'h24_relance', 'h20_cancel'));

ALTER TABLE public.booking_email_templates
    DROP CONSTRAINT IF EXISTS booking_email_templates_email_type_check;

ALTER TABLE public.booking_email_templates
    ADD CONSTRAINT booking_email_templates_email_type_check
    CHECK (email_type IN ('immediate', 'h48_confirm', 'h24_relance', 'h20_cancel'));

INSERT INTO public.booking_email_templates (category, email_type, subject, body)
VALUES
    (
        'agence',
        'h20_cancel',
        'Votre rendez-vous avec Hercule est annulé',
        '{{firstNameLine}}

Faute de confirmation de votre part, votre rendez-vous prévu le {{date}} à {{heure}} a été annulé.

Votre créneau a été libéré et pourra être proposé à une autre agence.

Cordialement,'
    )
ON CONFLICT (category, email_type) DO NOTHING;
