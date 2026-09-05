-- AI Reply Agent: campaign config, inbound/outbound messages, manual send queue.

CREATE TABLE IF NOT EXISTS public.ai_reply_agent_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    webhook_auto_send_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.ai_reply_agent_settings (id, webhook_auto_send_enabled)
VALUES (1, TRUE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.ai_reply_agent_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ai_reply_agent_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id TEXT NOT NULL UNIQUE,
    campaign_name TEXT,
    niche_preset_id TEXT NOT NULL,
    niche_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    target_type TEXT NOT NULL CHECK (target_type IN ('buyer', 'seller')),
    prompt_key TEXT NOT NULL,
    prompt_snapshot TEXT NOT NULL DEFAULT '',
    webhook_id TEXT,
    ooo_webhook_id TEXT,
    status TEXT NOT NULL DEFAULT 'not_initialized' CHECK (
        status IN ('not_initialized', 'waiting_for_replies', 'paused')
    ),
    initialized_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_reply_agent_config ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ai_reply_agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id TEXT NOT NULL,
    lead_email TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    event_type TEXT,
    instantly_email_id TEXT,
    subject TEXT,
    body_text TEXT NOT NULL DEFAULT '',
    email_account TEXT,
    unibox_url TEXT,
    ai_status TEXT NOT NULL CHECK (
        ai_status IN (
            'pending',
            'auto_replied',
            'skipped_unsafe',
            'skipped_ooo',
            'skipped_collision',
            'manual_replied',
            'manual_queued',
            'failed'
        )
    ),
    ai_reason TEXT,
    groq_model TEXT,
    thread_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    reply_to_uuid TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_reply_agent_messages_idempotency_idx
    ON public.ai_reply_agent_messages (campaign_id, lead_email, instantly_email_id)
    WHERE instantly_email_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ai_reply_agent_messages_inbox_idx
    ON public.ai_reply_agent_messages (campaign_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_reply_agent_messages_problem_idx
    ON public.ai_reply_agent_messages (campaign_id, ai_status, created_at DESC)
    WHERE ai_status IN ('skipped_unsafe', 'skipped_ooo');

ALTER TABLE public.ai_reply_agent_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ai_reply_agent_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT UNIQUE NOT NULL,
    campaign_id TEXT NOT NULL,
    lead_email TEXT NOT NULL,
    message_id UUID REFERENCES public.ai_reply_agent_messages (id),
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

CREATE INDEX IF NOT EXISTS ai_reply_agent_jobs_due_idx
    ON public.ai_reply_agent_jobs (scheduled_for)
    WHERE status = 'pending';

ALTER TABLE public.ai_reply_agent_jobs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.ai_reply_agent_settings IS
  'Global emergency kill-switch for AI Reply Agent auto-sends.';
COMMENT ON TABLE public.ai_reply_agent_config IS
  'Per-Instantly-campaign AI Reply Agent setup. prompt_snapshot frozen at Send to Prod.';
COMMENT ON TABLE public.ai_reply_agent_messages IS
  'Inbound Instantly replies and outbound AI/manual answers.';
COMMENT ON TABLE public.ai_reply_agent_jobs IS
  'Queued manual Problem-tab replies outside Paris Mon-Fri 08:00-17:00.';
