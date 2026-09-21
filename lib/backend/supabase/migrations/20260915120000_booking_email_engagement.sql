-- Track Resend engagement events on booking email jobs.

ALTER TABLE public.booking_email_jobs
  ADD COLUMN IF NOT EXISTS opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS clicked_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_booking_email_jobs_resend_email_id
  ON public.booking_email_jobs (resend_email_id)
  WHERE resend_email_id IS NOT NULL;
