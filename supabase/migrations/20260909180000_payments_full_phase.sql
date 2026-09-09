-- Agence Fast checkout — paiement intégral en une fois (payment_phase = full).

ALTER TABLE public.payments
    DROP CONSTRAINT IF EXISTS payments_payment_phase_check;

ALTER TABLE public.payments
    ADD CONSTRAINT payments_payment_phase_check
    CHECK (payment_phase IN ('deposit', 'balance', 'full'));

COMMENT ON COLUMN public.payments.payment_phase IS
  'deposit = 50% at signup; balance = remaining 50% after delivery; full = 100% upfront (Fast).';
