-- Conference live sale window (singleton) + client delivery appointments

CREATE TABLE public.conference_sale_windows (
    id                  UUID PRIMARY KEY,
    status              TEXT NOT NULL DEFAULT 'idle'
                            CHECK (status IN ('idle', 'open', 'closed')),
    started_at          TIMESTAMPTZ,
    ends_at             TIMESTAMPTZ,
    duration_seconds    INT NOT NULL DEFAULT 300
                            CHECK (duration_seconds > 0),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.conference_sale_windows IS
    'Singleton live conference checkout window. Timer SoT for /conference/inscription.';

ALTER TABLE public.conference_sale_windows ENABLE ROW LEVEL SECURITY;

INSERT INTO public.conference_sale_windows (id, status, duration_seconds)
VALUES ('00000000-0000-4000-8000-000000000001', 'idle', 300);

CREATE TABLE public.client_appointments (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id                   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    calendly_invitee_uri        TEXT NOT NULL,
    calendly_event_uri          TEXT,
    calendly_event_type_uri     TEXT,
    invitee_email               TEXT NOT NULL,
    invitee_name                TEXT,
    questions                   JSONB NOT NULL DEFAULT '{}'::jsonb,
    scheduled_at                TIMESTAMPTZ,
    status                      TEXT NOT NULL DEFAULT 'scheduled'
                                    CHECK (status IN (
                                        'scheduled',
                                        'no_show',
                                        'refused',
                                        'rescheduled',
                                        'canceled'
                                    )),
    credited                    BOOLEAN NOT NULL DEFAULT TRUE,
    join_url                    TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT client_appointments_invitee_uri_key UNIQUE (calendly_invitee_uri)
);

COMMENT ON TABLE public.client_appointments IS
    'RDV livraison on a conference client Calendly seat (host = client).';

CREATE INDEX client_appointments_client_id_idx
    ON public.client_appointments (client_id);
CREATE INDEX client_appointments_status_idx
    ON public.client_appointments (status);
CREATE INDEX client_appointments_scheduled_at_idx
    ON public.client_appointments (scheduled_at);

ALTER TABLE public.client_appointments ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER conference_sale_windows_set_updated_at
    BEFORE UPDATE ON public.conference_sale_windows
    FOR EACH ROW EXECUTE FUNCTION public.set_link_tracking_updated_at();

CREATE TRIGGER client_appointments_set_updated_at
    BEFORE UPDATE ON public.client_appointments
    FOR EACH ROW EXECUTE FUNCTION public.set_link_tracking_updated_at();
