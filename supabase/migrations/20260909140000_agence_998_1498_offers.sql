-- Agence 998 € / 1 498 € offers with 50/50 deposit + balance payments.

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS payment_phase TEXT NOT NULL DEFAULT 'deposit'
        CHECK (payment_phase IN ('deposit', 'balance'));

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS parent_payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS payments_parent_payment_id_idx ON public.payments (parent_payment_id);
CREATE INDEX IF NOT EXISTS payments_agence_phase_idx ON public.payments (agence_id, payment_phase, status);

ALTER TABLE public.payments
    DROP CONSTRAINT IF EXISTS payments_offer_type_check;

ALTER TABLE public.payments
    ADD CONSTRAINT payments_offer_type_check
    CHECK (offer_type IN (
        'monthly_1489',
        'pack_989x3',
        'starter_1489_5',
        'starter_998_5',
        'growth_1498_10',
        'monthly_1499',
        'pack_3x1499',
        'starter_999_5'
    ));

COMMENT ON COLUMN public.payments.payment_phase IS
  'deposit = 50% at signup; balance = remaining 50% after contract delivery.';

COMMENT ON COLUMN public.payments.parent_payment_id IS
  'Balance payment links back to the succeeded deposit row.';
