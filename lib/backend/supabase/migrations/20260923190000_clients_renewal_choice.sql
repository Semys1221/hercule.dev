-- First monthly renewal decision (asked once, before the second charge).

ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS renewal_choice TEXT,
    ADD COLUMN IF NOT EXISTS renewal_choice_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS renewal_prompt_closed_at TIMESTAMPTZ;

ALTER TABLE public.clients
    DROP CONSTRAINT IF EXISTS clients_renewal_choice_check;

ALTER TABLE public.clients
    ADD CONSTRAINT clients_renewal_choice_check
    CHECK (renewal_choice IS NULL OR renewal_choice IN ('continue', 'pause'));

COMMENT ON COLUMN public.clients.renewal_choice IS
  'First monthly renewal: continue leaves Stripe unchanged; pause sets pause_collection.';

COMMENT ON COLUMN public.clients.renewal_choice_at IS
  'When the client answered the one-time renewal prompt.';

COMMENT ON COLUMN public.clients.renewal_prompt_closed_at IS
  'Prompt will not be shown again — answer recorded, or first cycle ended without an answer.';
