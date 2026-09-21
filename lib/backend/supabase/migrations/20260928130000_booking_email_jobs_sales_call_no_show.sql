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
        'onboarding_complete',
        'sales_call_completed',
        'sales_call_not_paid',
        'sales_call_no_show',
        'onboarding_sequence',
        'admin_match',
        'calendly_match_booking',
        'cron_rdv_survey',
        'cron_sold_check',
        'stripe_payment_notification',
        'deliverance_admin'
    ));
