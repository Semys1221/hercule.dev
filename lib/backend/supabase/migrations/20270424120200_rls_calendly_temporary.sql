-- RLS: service_role only for staging + Calendly onboarding (no anon/authenticated access).

ALTER TABLE public.temporary_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendly_seat_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS temporary_leads_service_role_all ON public.temporary_leads;
CREATE POLICY temporary_leads_service_role_all ON public.temporary_leads
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS calendly_seat_onboarding_service_role_all ON public.calendly_seat_onboarding;
CREATE POLICY calendly_seat_onboarding_service_role_all ON public.calendly_seat_onboarding
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
