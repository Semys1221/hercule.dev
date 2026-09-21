-- Calendly seat onboarding workflow (post-Stripe payment).

CREATE TABLE IF NOT EXISTS public.calendly_seat_onboarding (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agence_id uuid NOT NULL REFERENCES public.agence (id) ON DELETE CASCADE,
    email text NOT NULL,
    status text NOT NULL DEFAULT 'awaiting_invite'
        CHECK (status IN ('awaiting_invite', 'invite_pending', 'active', 'reminder_sent')),
    started_at timestamptz NOT NULL DEFAULT now(),
    welcome_sent_at timestamptz,
    reminder_sent_at timestamptz,
    last_checked_at timestamptz,
    calendly_invitation_status text
        CHECK (
            calendly_invitation_status IS NULL
            OR calendly_invitation_status IN ('pending', 'accepted', 'declined')
        ),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT calendly_seat_onboarding_agence_id_key UNIQUE (agence_id)
);

CREATE INDEX IF NOT EXISTS idx_calendly_seat_onboarding_status
    ON public.calendly_seat_onboarding (status);

CREATE INDEX IF NOT EXISTS idx_calendly_seat_onboarding_email
    ON public.calendly_seat_onboarding (lower(email));

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
        'role_seq_24',
        'product_calendly_welcome',
        'product_calendly_reminder'
    ));

ALTER TABLE public.booking_email_jobs
    DROP CONSTRAINT IF EXISTS booking_email_jobs_triggered_by_check;

ALTER TABLE public.booking_email_jobs
    ADD CONSTRAINT booking_email_jobs_triggered_by_check
    CHECK (triggered_by IN (
        'calendly',
        'manual',
        'retry',
        'role_recovery',
        'stripe_payment',
        'calendly_seat_cron'
    ));

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
        'role_seq_24',
        'product_calendly_welcome',
        'product_calendly_reminder'
    ));

INSERT INTO public.booking_email_templates (category, email_type, subject, body, updated_at)
VALUES
    (
        'agence',
        'product_calendly_welcome',
        'Bienvenue chez Hercule — prochaine étape Calendly',
        '{{firstNameLine}}

Merci pour votre confiance. Votre paiement est bien confirmé.

Dans les prochaines heures, vous recevrez une invitation Calendly sur {{email}} pour accéder à votre espace Hercule et configurer votre agenda de livraison.

En attendant, vous pouvez consulter votre tableau de bord ici :
{{dashboardLink}}

À très vite,
L''équipe Hercule',
        NOW()
    ),
    (
        'agence',
        'product_calendly_reminder',
        'Rappel — acceptez votre invitation Calendly',
        '{{firstNameLine}}

Nous n''avons pas encore vu votre invitation Calendly acceptée pour {{email}}.

Merci de vérifier votre boîte mail (et vos spams) et d''accepter l''invitation pour activer votre accès Calendly.

Si vous n''avez pas reçu l''invitation, répondez à cet email ou contactez-nous à contact@hercule.dev.

Votre tableau de bord : {{dashboardLink}}',
        NOW()
    )
ON CONFLICT (category, email_type) DO NOTHING;
