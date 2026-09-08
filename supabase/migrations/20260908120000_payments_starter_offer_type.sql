-- Add starter_1489_5 offer type for agence Starter one-shot checkout.

ALTER TABLE public.payments
    DROP CONSTRAINT IF EXISTS payments_offer_type_check;

ALTER TABLE public.payments
    ADD CONSTRAINT payments_offer_type_check
    CHECK (offer_type IN (
        'starter_1489_5',
        'monthly_1489',
        'pack_989x3',
        'monthly_1499',
        'pack_3x1499'
    ));
