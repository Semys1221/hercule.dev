-- Per-job HTML/React override for booking emails (NULL = default by email_type).

ALTER TABLE public.booking_email_jobs
    ADD COLUMN IF NOT EXISTS use_html BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN public.booking_email_jobs.use_html IS
  'When set, overrides defaultUseHtml(email_type). NULL applies sequence defaults at send time.';
