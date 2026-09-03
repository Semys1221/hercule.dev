-- Email threading metadata for Resend booking sequence (In-Reply-To / References).

ALTER TABLE public.booking_email_jobs
    ADD COLUMN IF NOT EXISTS resend_message_id TEXT,
    ADD COLUMN IF NOT EXISTS thread_subject TEXT;

COMMENT ON COLUMN public.booking_email_jobs.resend_message_id IS
  'RFC Message-ID from Resend (used for In-Reply-To threading on follow-ups).';
COMMENT ON COLUMN public.booking_email_jobs.thread_subject IS
  'Root thread subject from immediate email (without Re: prefix).';
