-- Post-E1 ack + Calendly system skip statuses for reply agent workflow gates.

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
            'skipped_post_e1_ack',
            'skipped_calendly_system',
            'manual_replied',
            'manual_queued',
            'failed'
        )
    );

COMMENT ON CONSTRAINT ai_reply_agent_messages_ai_status_check ON public.ai_reply_agent_messages IS
  'skipped_post_e1_ack: pure interest after E1 — no second AI reply. skipped_calendly_system: Calendly notification — ignored.';
