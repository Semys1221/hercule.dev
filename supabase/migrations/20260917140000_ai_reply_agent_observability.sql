-- AI Reply Agent: webhook latency + knowledge pack audit hash.

ALTER TABLE public.ai_reply_agent_messages
    ADD COLUMN IF NOT EXISTS latency_ms INTEGER;

ALTER TABLE public.ai_reply_agent_messages
    ADD COLUMN IF NOT EXISTS knowledge_pack_hash TEXT;

COMMENT ON COLUMN public.ai_reply_agent_messages.latency_ms IS
  'End-to-end webhook handler latency in milliseconds.';

COMMENT ON COLUMN public.ai_reply_agent_messages.knowledge_pack_hash IS
  'SHA-256 prefix of the knowledge pack used for the Grok call (audit trail).';

CREATE INDEX IF NOT EXISTS ai_reply_agent_messages_failed_recent_idx
    ON public.ai_reply_agent_messages (created_at DESC)
    WHERE direction = 'inbound' AND ai_status = 'failed';

CREATE INDEX IF NOT EXISTS ai_reply_agent_messages_pending_stale_idx
    ON public.ai_reply_agent_messages (created_at)
    WHERE direction = 'inbound' AND ai_status = 'pending';
