-- Booking funnel qualification answers for comptable_delivery leads.

CREATE TABLE IF NOT EXISTS public.comptable_delivery_booking_qualification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comptable_delivery_id UUID NOT NULL REFERENCES public.comptable_delivery (id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    route_segment TEXT NOT NULL,
    phase TEXT NOT NULL CHECK (phase IN ('pre_booking', 'post_booking')),
    current_step_id TEXT NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    pre_booking_completed_at TIMESTAMPTZ,
    booked_at TIMESTAMPTZ,
    post_booking_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT comptable_delivery_booking_qualification_lead_unique UNIQUE (comptable_delivery_id)
);

CREATE INDEX IF NOT EXISTS comptable_delivery_booking_qualification_slug_idx
    ON public.comptable_delivery_booking_qualification (slug);

CREATE TRIGGER comptable_delivery_booking_qualification_set_updated_at
    BEFORE UPDATE ON public.comptable_delivery_booking_qualification
    FOR EACH ROW
    EXECUTE FUNCTION public.set_link_tracking_updated_at();

COMMENT ON TABLE public.comptable_delivery_booking_qualification IS
    'Pre/post Calendly qualification funnel state for cabinet delivery reservation links.';
