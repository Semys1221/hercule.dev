-- Per-lead current AI reply draft (overwritten on each regeneration).

CREATE TABLE IF NOT EXISTS public.ai_reply_agent_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id TEXT NOT NULL,
    lead_email TEXT NOT NULL,
    ai_reply_agent_1 TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (campaign_id, lead_email)
);

CREATE INDEX IF NOT EXISTS ai_reply_agent_leads_campaign_idx
    ON public.ai_reply_agent_leads (campaign_id);

ALTER TABLE public.ai_reply_agent_leads ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.ai_reply_agent_leads IS
  'Current AI reply draft per (campaign_id, lead_email). ai_reply_agent_1 is overwritten on each regeneration.';
