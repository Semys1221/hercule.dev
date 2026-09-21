-- AI Reply Agent: skip auto-reply until lead responds after interested_email1 (E1).

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
            'skipped_waiting_e1',
            'manual_replied',
            'manual_queued',
            'failed'
        )
    );

COMMENT ON CONSTRAINT ai_reply_agent_messages_ai_status_check ON public.ai_reply_agent_messages IS
  'skipped_waiting_e1: Interested lead inbound arrived before/at E1 dispatch — wait for post-E1 reply.';
