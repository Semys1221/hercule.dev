-- Link a Calendly event type to a conference client dashboard.

ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS calendly_event_type_uri TEXT;

COMMENT ON COLUMN public.clients.calendly_event_type_uri IS
    'Calendly event type URI whose bookings appear on the client dashboard.';

CREATE INDEX IF NOT EXISTS clients_calendly_event_type_uri_idx
    ON public.clients (calendly_event_type_uri)
    WHERE calendly_event_type_uri IS NOT NULL;
