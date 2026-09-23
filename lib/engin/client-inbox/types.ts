export type InboxDirection = "in" | "out";

export type ClientInboxSyncStateRow = {
  mailbox: string;
  history_id: string | null;
  watch_expiration: string | null;
  last_sync_at: string | null;
  last_error: string | null;
};

export type ClientInboxThreadRow = {
  id: string;
  client_id: string;
  gmail_thread_id: string;
  subject: string;
  snippet: string;
  last_message_at: string;
  last_direction: InboxDirection;
  needs_reply: boolean;
  ambiguous_client: boolean;
  created_at: string;
  updated_at: string;
};

export type ClientInboxMessageRow = {
  id: string;
  thread_id: string;
  gmail_message_id: string;
  direction: InboxDirection;
  from_email: string;
  to_emails: string[];
  subject: string;
  body_text: string;
  body_html: string | null;
  sent_at: string;
  raw_headers: Record<string, string>;
};

export type ClientInboxThreadStateRow = {
  thread_id: string;
  read_at: string | null;
  snoozed_until: string | null;
  resolved_at: string | null;
};

export type ClientInboxDraftRow = {
  id: string;
  client_id: string;
  thread_id: string | null;
  subject: string;
  body: string;
  updated_at: string;
};

export type ParsedGmailMessage = {
  gmailMessageId: string;
  gmailThreadId: string;
  fromEmail: string;
  toEmails: string[];
  subject: string;
  bodyText: string;
  bodyHtml: string | null;
  sentAt: Date;
  headers: Record<string, string>;
  snippet: string;
};

export type ClientEmailMatch = {
  clientId: string;
  ambiguous: boolean;
};
