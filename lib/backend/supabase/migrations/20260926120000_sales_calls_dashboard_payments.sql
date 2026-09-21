-- Sales calls, client dashboard link, payments, and product delivery status (agence).

ALTER TABLE public.agence
    ADD COLUMN IF NOT EXISTS dashboard_link TEXT;

COMMENT ON COLUMN public.agence.dashboard_link IS
  'Client tracking dashboard URL, set when statut becomes MEETING_BOOKED.';

CREATE TYPE public.sales_call_status AS ENUM (
    'scheduled',
    'completed',
    'no_show',
    'not_paid',
    'paid'
);

CREATE TABLE public.sales_calls (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agence_id             UUID REFERENCES public.agence(id) ON DELETE SET NULL,
    email                 TEXT NOT NULL,
    calendly_invitee_uri  TEXT NOT NULL UNIQUE,
    scheduled_at          TIMESTAMPTZ,
    status                public.sales_call_status NOT NULL DEFAULT 'scheduled',
    notes                 JSONB NOT NULL DEFAULT '{}'::jsonb,
    forecast_cents        INT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX sales_calls_agence_id_idx ON public.sales_calls (agence_id);
CREATE INDEX sales_calls_email_lower_idx ON public.sales_calls (lower(trim(email)));
CREATE INDEX sales_calls_scheduled_at_idx ON public.sales_calls (scheduled_at);

COMMENT ON TABLE public.sales_calls IS
  'Commercial Calendly calls — qualification notes and paid/not_paid status.';

CREATE TYPE public.product_statut AS ENUM (
    'NONE',
    'ONBOARDED',
    'IN_DELIVERANCE',
    'MATCH_PROPOSED',
    'MEETING_BOOKED',
    'POST_RDV_SURVEY',
    'SOLD',
    'ARCHIVED',
    'CANCELLED'
);

ALTER TABLE public.agence
    ADD COLUMN IF NOT EXISTS product_statut public.product_statut NOT NULL DEFAULT 'NONE';

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'succeeded',
    'failed',
    'refunded'
);

CREATE TABLE public.payments (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agence_id                   UUID NOT NULL REFERENCES public.agence(id) ON DELETE CASCADE,
    offer_type                  TEXT NOT NULL,
    amount_cents                INT NOT NULL,
    status                      public.payment_status NOT NULL DEFAULT 'pending',
    stripe_checkout_session_id  TEXT UNIQUE,
    stripe_payment_intent_id    TEXT,
    stripe_event_id             TEXT UNIQUE,
    succeeded_at                TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX payments_agence_id_idx ON public.payments (agence_id);
CREATE INDEX payments_status_idx ON public.payments (status);

COMMENT ON TABLE public.payments IS
  'Stripe checkout records for agence product offers.';

UPDATE public.agence
SET dashboard_link = 'https://www.hercule.dev/dashboard.html/' || slug
WHERE statut IN ('MEETING_BOOKED', 'BOOKED', 'CONFIRMED')
  AND dashboard_link IS NULL;

ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
