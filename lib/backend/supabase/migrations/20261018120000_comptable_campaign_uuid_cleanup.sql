-- Comptable prod campaign UUID: e4c58718-ca00-4e27-b714-68e522fe4db6 (Instantly "Comptable").
-- Legacy UUID a32c814b-2c9c-4015-935d-da15bdea2373 was a deleted Instantly campaign;
-- reply agent + bypass rows pointed at the wrong id (see 20261008120000_comptable_subsequence_copy.sql).

DELETE FROM public.ai_reply_agent_messages
WHERE campaign_id = 'a32c814b-2c9c-4015-935d-da15bdea2373';

DELETE FROM public.ai_reply_agent_leads
WHERE campaign_id = 'a32c814b-2c9c-4015-935d-da15bdea2373';

DELETE FROM public.ai_reply_agent_jobs
WHERE campaign_id = 'a32c814b-2c9c-4015-935d-da15bdea2373';

DELETE FROM public.ai_reply_agent_blocklist
WHERE campaign_id = 'a32c814b-2c9c-4015-935d-da15bdea2373';

DELETE FROM public.ai_reply_agent_config
WHERE campaign_id = 'a32c814b-2c9c-4015-935d-da15bdea2373';

DELETE FROM public.instantly_bypass_jobs
WHERE campaign_id = 'a32c814b-2c9c-4015-935d-da15bdea2373';

DELETE FROM public.instantly_bypass_events
WHERE campaign_id = 'a32c814b-2c9c-4015-935d-da15bdea2373';

DELETE FROM public.instantly_bypass_pipeline
WHERE campaign_id = 'a32c814b-2c9c-4015-935d-da15bdea2373';

DELETE FROM public.instantly_bypass_templates
WHERE campaign_id = 'a32c814b-2c9c-4015-935d-da15bdea2373';

DELETE FROM public.instantly_bypass_config
WHERE campaign_id = 'a32c814b-2c9c-4015-935d-da15bdea2373';
