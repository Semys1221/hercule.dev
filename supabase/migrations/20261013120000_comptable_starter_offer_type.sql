-- Add Hercule Comptable Starter offer type (999 € one-shot, 5 missions).

ALTER TABLE public.payments
    DROP CONSTRAINT IF EXISTS payments_offer_type_check;

ALTER TABLE public.payments
    ADD CONSTRAINT payments_offer_type_check
    CHECK (offer_type IN (
        'monthly_1489',
        'pack_989x3',
        'starter_1489_5',
        'monthly_1499',
        'pack_3x1499',
        'starter_999_5'
    ));
