-- Terminal status for pre-E1 qualification inbounds once interested_email1 is sent.

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
            'superseded_by_e1',
            'manual_replied',
            'manual_queued',
            'failed'
        )
    );

COMMENT ON CONSTRAINT ai_reply_agent_messages_ai_status_check ON public.ai_reply_agent_messages IS
  'superseded_by_e1: pre-E1 qualification inbound — E1 is the answer; never reprocess.';
