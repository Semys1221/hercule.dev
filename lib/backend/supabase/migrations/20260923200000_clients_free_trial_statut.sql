-- DEC free trial lifecycle on public.clients (enum values only).

ALTER TYPE public.product_statut ADD VALUE IF NOT EXISTS 'FREE_TRIAL_PENDING_ONBOARDING';
ALTER TYPE public.product_statut ADD VALUE IF NOT EXISTS 'FREE_TRIAL';
