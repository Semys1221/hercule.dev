-- AI Reply Agent: blocklist for dismissed pending leads + skipped_not_interested status.

CREATE TABLE IF NOT EXISTS public.ai_reply_agent_blocklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id TEXT NOT NULL,
    lead_email TEXT NOT NULL,
    blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason TEXT,
    UNIQUE (campaign_id, lead_email)
);

CREATE INDEX IF NOT EXISTS ai_reply_agent_blocklist_campaign_idx
    ON public.ai_reply_agent_blocklist (campaign_id);

ALTER TABLE public.ai_reply_agent_blocklist ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.ai_reply_agent_blocklist IS
  'Leads dismissed from Pending Unibox; excluded on next fetch. Conversation stays in Instantly.';

-- Extend ai_status CHECK to include skipped_not_interested.
ALTER TABLE public.ai_reply_agent_messages
    DROP CONSTRAINT IF EXISTS ai_reply_agent_messages_ai_status_check;

ALTER TABLE public.ai_reply_agent_messages
    ADD CONSTRAINT ai_reply_agent_messages_ai_status_check
    CHECK (
        ai_status IN (
            'pending',
            'auto_replied',
            'skipped_unsafe',
            'skipped_ooo',
            'skipped_collision',
            'skipped_not_interested',
            'manual_replied',
            'manual_queued',
            'failed'
        )
    );
