export type BypassTemplateKey =
  | "interested_email1"
  | "interested_email2"
  | "interested_email3"
  | "no_show_email1"
  | "no_show_email2";

export type BypassFlow = BypassTemplateKey;

export type BypassEventStatus = "sent" | "skipped" | "failed";

export type InstantlyWebhookPayload = {
  timestamp?: string;
  event_type?: string;
  workspace?: string;
  campaign_id?: string;
  campaign_name?: string;
  lead_email?: string;
  email_account?: string;
  email_id?: string;
  reply_subject?: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  companyName?: string;
  company_name?: string;
  [key: string]: unknown;
};

export type InstantlyEmailRecord = {
  id?: string;
  eaccount?: string;
  lead?: string;
  lead_id?: string;
  thread_id?: string;
  subject?: string;
  timestamp_email?: string;
  timestamp_created?: string;
  email_type?: string;
};

export type InstantlyLeadRecord = {
  id?: string;
  email?: string;
  campaign?: string;
  subsequence_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  lt_interest_status?: number | null;
  payload?: Record<string, unknown> | null;
  status_summary_subseq?: {
    stepID?: string;
    timestampExecuted?: string;
  } | null;
};

export type BypassTemplate = {
  campaign_id?: string;
  template_key: BypassTemplateKey;
  subject: string;
  body_html: string;
};

export type BypassConfig = {
  campaign_id: string;
  campaign_name?: string | null;
  webhook_id?: string | null;
  webhook_auto_send_enabled?: boolean | null;
  initialized_at?: string | null;
};

export type TemplateVariables = Record<string, string>;

export type HandleInterestedResult = {
  ok: boolean;
  skipped?: string;
  error?: string;
  latencyMs?: number;
  replyToUuid?: string;
};
