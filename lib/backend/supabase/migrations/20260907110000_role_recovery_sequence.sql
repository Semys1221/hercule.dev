-- Role recovery sequence: alternate 2-email pathway for untracked Calendly bookings.

ALTER TABLE public.booking_email_jobs
    DROP CONSTRAINT IF EXISTS booking_email_jobs_email_type_check;

ALTER TABLE public.booking_email_jobs
    ADD CONSTRAINT booking_email_jobs_email_type_check
    CHECK (email_type IN (
        'immediate',
        'h48_confirm',
        'h24_relance',
        'h20_cancel',
        'role_seq_48',
        'role_seq_24'
    ));

ALTER TABLE public.booking_email_jobs
    DROP CONSTRAINT IF EXISTS booking_email_jobs_triggered_by_check;

ALTER TABLE public.booking_email_jobs
    ADD CONSTRAINT booking_email_jobs_triggered_by_check
    CHECK (triggered_by IN ('calendly', 'manual', 'retry', 'role_recovery'));

ALTER TABLE public.booking_email_templates
    DROP CONSTRAINT IF EXISTS booking_email_templates_email_type_check;

ALTER TABLE public.booking_email_templates
    ADD CONSTRAINT booking_email_templates_email_type_check
    CHECK (email_type IN (
        'immediate',
        'h48_confirm',
        'h24_relance',
        'h20_cancel',
        'role_seq_48',
        'role_seq_24'
    ));

INSERT INTO public.booking_email_templates (category, email_type, subject, body, updated_at)
VALUES
    (
        'agence',
        'role_seq_48',
        'Hercule — avant votre rendez-vous',
        '{{firstNameLine}}

Le principe d''Hercule tient en quelques mots.

La crainte des entreprises que nous auditons est simple : ne pas savoir si les recommandations d''une agence sont réellement adaptées à leur activité.

C''est précisément là qu''Hercule prend son sens : faire ce tri et orienter chaque entreprise vers ce qui lui correspond réellement.

Nous en parlerons ensemble au rendez-vous.',
        NOW()
    ),
    (
        'agence',
        'role_seq_24',
        'Confirmer votre créneau — Hercule',
        '{{firstNameLine}}

J''ai le plaisir de vous confirmer que les contrats d''agence présentés lors de votre entretien concerneront des cabinets de conseil financier situés en région Aquitaine et PACA.

Afin de garantir votre créneau, merci de confirmer votre présence ici : {{confirmLink}}

Sans confirmation, votre créneau pourra être réattribué à une autre agence en fonction.',
        NOW()
    )
ON CONFLICT (category, email_type) DO NOTHING;
