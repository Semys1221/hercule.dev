export type AiReplyTargetType = "buyer" | "seller";

export type AiReplyConfigStatus =
  | "not_initialized"
  | "waiting_for_replies"
  | "paused";

export type AiReplyMessageStatus =
  | "pending"
  | "auto_replied"
  | "skipped_unsafe"
  | "skipped_ooo"
  | "skipped_collision"
  | "skipped_not_interested"
  | "manual_replied"
  | "manual_queued"
  | "failed";

export type InstantlyReplyWebhookPayload = {
  timestamp?: string;
  event_type?: string;
  workspace?: string;
  campaign_id?: string;
  campaign_name?: string;
  lead_email?: string;
  email_account?: string;
  email_id?: string;
  reply_subject?: string;
  reply_text?: string;
  reply_html?: string;
  reply_text_snippet?: string;
  unibox_url?: string;
  step?: number;
  variant?: number;
  is_first?: boolean;
  [key: string]: unknown;
};

export type AiReplyAgentConfig = {
  id: string;
  campaign_id: string;
  campaign_name: string | null;
  niche_preset_id: string;
  niche_metadata: Record<string, unknown>;
  target_type: AiReplyTargetType;
  prompt_key: string;
  prompt_snapshot: string;
  webhook_id: string | null;
  ooo_webhook_id: string | null;
  max_sentences: number;
  status: AiReplyConfigStatus;
  initialized_at: string | null;
  updated_at: string;
};

export type GroqReplyDecision = {
  should_reply: boolean;
  reply_text: string | null;
  reason: string;
};

export type HandleReplyResult = {
  ok: boolean;
  skipped?: string;
  error?: string;
  aiStatus?: AiReplyMessageStatus;
  latencyMs?: number;
};
