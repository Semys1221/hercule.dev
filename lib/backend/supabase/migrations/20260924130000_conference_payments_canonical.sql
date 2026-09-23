-- Conference-only checkout model: relax legacy payment_phase; document canonical offer types.

ALTER TABLE public.payments
    DROP CONSTRAINT IF EXISTS payments_payment_phase_check;

ALTER TABLE public.payments
    ALTER COLUMN payment_phase DROP NOT NULL;

ALTER TABLE public.payments
    ALTER COLUMN payment_phase DROP DEFAULT;

DROP INDEX IF EXISTS payments_agence_phase_idx;

COMMENT ON COLUMN public.payments.payment_phase IS
  'Legacy agence 50/50 (deposit|balance|full). Unused for conference Payment Link checkouts (client_id).';

COMMENT ON TABLE public.payments IS
  'Stripe payments. New sales: conference_* offer_type + client_id. Legacy rows may reference agence/comptable FKs.';
