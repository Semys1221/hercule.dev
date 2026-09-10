-- Comptable monthly offers (Lite + Starter) use Stripe subscriptions.

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS payments_stripe_subscription_id_idx
    ON public.payments (stripe_subscription_id)
    WHERE stripe_subscription_id IS NOT NULL;

COMMENT ON COLUMN public.payments.stripe_subscription_id IS
  'Stripe Subscription ID for comptable Lite/Starter monthly checkouts. Null for one-shot (pack) or agence payments.';
