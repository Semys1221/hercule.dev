-- Appointments table (SOT-01) + agence delivery columns (DB-01)
-- Depends on: matches, agence, entreprise tables.

-- 1. appointments table — SoT for RDV livraison; attribution counter derived from this.
CREATE TABLE IF NOT EXISTS public.appointments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id                UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    agence_id               UUID NOT NULL REFERENCES public.agence(id) ON DELETE CASCADE,
    entreprise_id           UUID NOT NULL REFERENCES public.entreprise(id) ON DELETE CASCADE,
    kind                    TEXT NOT NULL DEFAULT 'delivery' CHECK (kind = 'delivery'),
    calendly_invitee_uri    TEXT UNIQUE,
    scheduled_at            TIMESTAMPTZ,
    status                  TEXT NOT NULL DEFAULT 'scheduled'
                                CHECK (status IN (
                                    'scheduled',
                                    'completed',
                                    'no_show_entreprise',
                                    'no_show_agence',
                                    'cancelled'
                                )),
    survey_token_agence     TEXT UNIQUE,
    survey_token_entreprise TEXT UNIQUE,
    completed_at            TIMESTAMPTZ,
    noshow_reported_at      TIMESTAMPTZ,
    noshow_reported_by      TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS appointments_match_id_idx
    ON public.appointments (match_id);
CREATE INDEX IF NOT EXISTS appointments_agence_id_idx
    ON public.appointments (agence_id);
CREATE INDEX IF NOT EXISTS appointments_entreprise_id_idx
    ON public.appointments (entreprise_id);
CREATE INDEX IF NOT EXISTS appointments_status_idx
    ON public.appointments (status);

COMMENT ON TABLE public.appointments IS
    'RDV livraison planifiés. Attribution consommée à l''insert; recrédit sur no_show_entreprise.';

-- 2. New agence delivery columns (DB-01)
ALTER TABLE public.agence
    ADD COLUMN IF NOT EXISTS deliverance_started_at   TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS estimated_completion_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS active_match_id          UUID REFERENCES public.matches(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS credits_remaining        INT,
    ADD COLUMN IF NOT EXISTS offer_type               TEXT
                                CHECK (offer_type IN ('monthly_1489', 'pack_989x3'));

COMMENT ON COLUMN public.agence.deliverance_started_at IS
    'Timestamp when IN_DELIVERANCE began (set by transitionToInDeliverance).';
COMMENT ON COLUMN public.agence.estimated_completion_at IS
    'Derived: deliverance_started_at + firstHonoredDaysStandard working days.';
COMMENT ON COLUMN public.agence.active_match_id IS
    'FK to current proposed/booked match. Nullable; cleared when match closes.';
COMMENT ON COLUMN public.agence.credits_remaining IS
    'Attribution credits for pack_989x3. NULL for monthly_1489.';
COMMENT ON COLUMN public.agence.offer_type IS
    'Offer purchased. NULL until first succeeded payment.';

-- 3. Unique partial index on matches — enforce 1 active match per agence.
--    "active" = proposed or booked (not yet sold/closed).
CREATE UNIQUE INDEX IF NOT EXISTS matches_one_active_per_agence
    ON public.matches (agence_id)
    WHERE status IN ('proposed', 'booked');
