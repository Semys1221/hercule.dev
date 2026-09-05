-- Onboarding profile JSONB on agence / entreprise leads.

ALTER TYPE public.lead_statut ADD VALUE IF NOT EXISTS 'ONBOARDED';

ALTER TABLE public.agence
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS profile JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.entreprise
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS profile JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.agence.profile IS
  'Central lead profile JSON — form, communication.delays, display.timeline, match, survey, offers.';

COMMENT ON COLUMN public.entreprise.profile IS
  'Central lead profile JSON — form, communication.delays, display.timeline, match, survey.';
