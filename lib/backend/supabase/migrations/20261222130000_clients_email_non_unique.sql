-- Allow multiple conference payments for the same Stripe email (new clients row each time)

DROP INDEX IF EXISTS public.clients_email_lower_idx;
CREATE INDEX IF NOT EXISTS clients_email_lower_idx ON public.clients (lower(trim(email)));
