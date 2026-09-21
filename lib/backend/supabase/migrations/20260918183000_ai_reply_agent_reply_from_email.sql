-- Track the actual sender address when a lead replies from a different inbox.

ALTER TABLE public.ai_reply_agent_messages
    ADD COLUMN IF NOT EXISTS reply_from_email TEXT;

CREATE INDEX IF NOT EXISTS ai_reply_agent_messages_reply_from_idx
    ON public.ai_reply_agent_messages (campaign_id, reply_from_email)
    WHERE reply_from_email IS NOT NULL;

COMMENT ON COLUMN public.ai_reply_agent_messages.reply_from_email IS
  'Actual From address on inbound reply when different from lead_email (Instantly from_address_email).';
