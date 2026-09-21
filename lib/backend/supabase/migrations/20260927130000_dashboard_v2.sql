-- Dashboard v2: new product_statut value, product_payment_welcome email type, and template.

-- 1. Add PAID_PENDING_ONBOARDING to product_statut enum
ALTER TYPE public.product_statut ADD VALUE IF NOT EXISTS 'PAID_PENDING_ONBOARDING';

-- 2. Update booking_email_jobs constraint to include product_payment_welcome
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
        'product_calendly_reminder',
        'product_payment_welcome'
    ));

-- 3. Update booking_email_templates constraint to include product_payment_welcome
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
        'product_calendly_reminder',
        'product_payment_welcome'
    ));

-- 4. Also update triggered_by constraint to include onboarding_complete trigger
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
        'calendly_seat_cron',
        'onboarding_complete'
    ));

-- 5. Insert default template for product_payment_welcome
INSERT INTO public.booking_email_templates (category, email_type, subject, body, updated_at)
VALUES (
    'agence',
    'product_payment_welcome',
    'Votre accès Hercule est activé',
    '{{firstNameLine}}

Votre paiement a bien été reçu. Votre accès Hercule est maintenant actif.

Prochaine étape : complétez votre onboarding pour démarrer la recherche de demandes.

{{dashboardLink}}

Votre facture a été émise — vous la recevrez d''ici peu.

L''équipe Hercule',
    NOW()
)
ON CONFLICT (category, email_type) DO NOTHING;
