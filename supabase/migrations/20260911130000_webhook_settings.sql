-- Runtime webhook pause/activate toggle (Streamlit Setup + production route).

CREATE TABLE IF NOT EXISTS public.instantly_bypass_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    webhook_auto_send_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.instantly_bypass_settings (id, webhook_auto_send_enabled)
VALUES (1, TRUE)
ON CONFLICT (id) DO UPDATE
SET
    webhook_auto_send_enabled = TRUE,
    updated_at = NOW();

ALTER TABLE public.instantly_bypass_settings ENABLE ROW LEVEL SECURITY;
