-- AI Reply Agent: recovery mode (skipped_recovery status + recovery_confidence analytics).

ALTER TABLE public.ai_reply_agent_messages
    DROP CONSTRAINT IF EXISTS ai_reply_agent_messages_ai_status_check;

ALTER TABLE public.ai_reply_agent_messages
    ADD CONSTRAINT ai_reply_agent_messages_ai_status_check
    CHECK (
        ai_status IN (
            'pending',
            'auto_replied',
            'skipped_unsafe',
            'skipped_recovery',
            'skipped_ooo',
            'skipped_collision',
            'skipped_not_interested',
            'manual_replied',
            'manual_queued',
            'failed'
        )
    );

ALTER TABLE public.ai_reply_agent_messages
    ADD COLUMN IF NOT EXISTS recovery_confidence SMALLINT;

COMMENT ON COLUMN public.ai_reply_agent_messages.recovery_confidence IS
  'Grok recovery_confidence (0–100) for Lead / Not interested inbound messages.';
