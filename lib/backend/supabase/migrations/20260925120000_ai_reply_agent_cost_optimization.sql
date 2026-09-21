-- AI Reply Agent: configurable sentence count + Grok cost observability.

ALTER TABLE public.ai_reply_agent_config
    ADD COLUMN IF NOT EXISTS max_sentences INTEGER NOT NULL DEFAULT 2;

ALTER TABLE public.ai_reply_agent_config
    DROP CONSTRAINT IF EXISTS ai_reply_agent_config_max_sentences_check;

ALTER TABLE public.ai_reply_agent_config
    ADD CONSTRAINT ai_reply_agent_config_max_sentences_check
    CHECK (max_sentences >= 1 AND max_sentences <= 10);

ALTER TABLE public.ai_reply_agent_messages
    ADD COLUMN IF NOT EXISTS groq_cost_usd_ticks BIGINT;

COMMENT ON COLUMN public.ai_reply_agent_config.max_sentences IS
  'Target sentence count for webhook Grok replies (1-10).';

COMMENT ON COLUMN public.ai_reply_agent_messages.groq_cost_usd_ticks IS
  'xAI cost_in_usd_ticks for the Grok call tied to this message (1 USD = 10^10 ticks).';
