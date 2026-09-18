import type { Niche } from "@/lib/admin/navigation";
import type { EmailSequenceProvider } from "@/lib/admin/email-sequences/registry";

export type ManagementPhase = "outreach" | "booking" | "client";

export type RecipientStatus =
  | "scheduled"
  | "active"
  | "paused"
  | "completed"
  | "stopped"
  | "failed";

export type EmailSequenceRecipient = {
  id: string;
  lead_email: string;
  lead_id: string | null;
  lead_category: Niche;
  phase: ManagementPhase;
  sequence_slug: string;
  provider: EmailSequenceProvider;
  status: RecipientStatus;
  campaign_id: string | null;
  current_step: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  paused_at: string | null;
  completed_at: string | null;
  stopped_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type RecipientStatusCounts = Record<RecipientStatus, number>;

export type ListRecipientsParams = {
  niche: Niche;
  phase?: ManagementPhase;
  status?: RecipientStatus;
  leadEmail?: string;
  limit?: number;
};

export type RecipientListRow = EmailSequenceRecipient & {
  slug?: string | null;
  cockpit_href?: string | null;
  sequence_name?: string | null;
};

export type ListRecipientsResult = {
  recipients: RecipientListRow[];
  counts: RecipientStatusCounts;
};
