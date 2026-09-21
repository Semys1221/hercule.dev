-- Deliverability control panel settings (internal admin).

CREATE TABLE IF NOT EXISTS public.deliverability_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    health_score_warn_below INTEGER NOT NULL DEFAULT 80 CHECK (health_score_warn_below BETWEEN 0 AND 100),
    inbox_rate_warn_below NUMERIC(5, 4) NOT NULL DEFAULT 0.8500 CHECK (inbox_rate_warn_below BETWEEN 0 AND 1),
    refresh_minutes INTEGER NOT NULL DEFAULT 15 CHECK (refresh_minutes BETWEEN 1 AND 120),
    excluded_emails TEXT[] NOT NULL DEFAULT '{}',
    auto_pause_on_alert BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.deliverability_settings (
    id,
    health_score_warn_below,
    inbox_rate_warn_below,
    refresh_minutes,
    excluded_emails,
    auto_pause_on_alert
)
VALUES (1, 80, 0.8500, 15, '{}', FALSE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.deliverability_settings ENABLE ROW LEVEL SECURITY;
