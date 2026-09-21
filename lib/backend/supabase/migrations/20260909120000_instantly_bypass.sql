-- Instantly subsequence bypass: templates, idempotency events, scheduled jobs, campaign config.

CREATE TABLE IF NOT EXISTS public.instantly_bypass_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key TEXT UNIQUE NOT NULL CHECK (
        template_key IN ('interested_email1', 'no_reply_email1', 'no_reply_email2')
    ),
    subject TEXT NOT NULL DEFAULT '',
    body_html TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.instantly_bypass_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id TEXT NOT NULL UNIQUE,
    campaign_name TEXT,
    interested_subsequence_id TEXT,
    no_reply_subsequence_id TEXT,
    waiting_for_reply_interest_value INTEGER,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.instantly_bypass_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT UNIQUE NOT NULL,
    flow TEXT NOT NULL CHECK (
        flow IN ('interested_email1', 'no_reply_email1', 'no_reply_email2')
    ),
    campaign_id TEXT NOT NULL,
    lead_email TEXT NOT NULL,
    lead_id TEXT,
    webhook_received_at TIMESTAMPTZ,
    dispatched_at TIMESTAMPTZ,
    latency_ms INTEGER,
    status TEXT NOT NULL CHECK (status IN ('sent', 'skipped', 'failed')),
    error_message TEXT,
    reply_to_uuid TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS instantly_bypass_events_campaign_lead_idx
    ON public.instantly_bypass_events (campaign_id, lead_email);

CREATE INDEX IF NOT EXISTS instantly_bypass_events_status_idx
    ON public.instantly_bypass_events (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.instantly_bypass_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT UNIQUE NOT NULL,
    campaign_id TEXT NOT NULL,
    lead_email TEXT NOT NULL,
    template_key TEXT NOT NULL DEFAULT 'no_reply_email2',
    scheduled_for TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'sent', 'cancelled', 'failed')
    ),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS instantly_bypass_jobs_due_idx
    ON public.instantly_bypass_jobs (scheduled_for)
    WHERE status = 'pending';

ALTER TABLE public.instantly_bypass_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instantly_bypass_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instantly_bypass_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instantly_bypass_jobs ENABLE ROW LEVEL SECURITY;

INSERT INTO public.instantly_bypass_templates (template_key, subject, body_html)
VALUES
    (
        'interested_email1',
        'Re: {{subject}}',
        'Bonjour {{first_name}},<br/><br/>Merci pour votre retour — je reviens vers vous très vite.<br/><br/>Bien cordialement'
    ),
    (
        'no_reply_email1',
        'Re: {{subject}}',
        'Bonjour {{first_name}},<br/><br/>Je me permets de revenir vers vous suite à mon précédent message.<br/><br/>Bien cordialement'
    ),
    (
        'no_reply_email2',
        'Re: {{subject}}',
        'Bonjour {{first_name}},<br/><br/>Dernier rappel amical — dites-moi si le sujet vous parle.<br/><br/>Bien cordialement'
    )
ON CONFLICT (template_key) DO NOTHING;

COMMENT ON TABLE public.instantly_bypass_templates IS
  'Email templates for Instantly subsequence bypass (Unibox reply API).';
COMMENT ON TABLE public.instantly_bypass_events IS
  'Idempotency log and analytics for bypass sends.';
COMMENT ON TABLE public.instantly_bypass_jobs IS
  'Scheduled No-Reply Email 2 jobs processed by cron.';
