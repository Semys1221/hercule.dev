import { handleInstantlyReply } from "./handler";
import { createAiReplyAgentClient } from "./supabase";
import { isAutomatedSenderEmail, resolveReplyFromEmail } from "./reply-from-email";
import { listEmails, getInstantlyApiKey } from "@/lib/instantly-bypass/client";
import { loadAiReplyConfig } from "./config";

import type { InstantlyEmailRecord } from "@/lib/instantly-bypass/types";
import type { InstantlyReplyWebhookPayload } from "./types";

export type AlternateReplySweepResult = {
  scanned: number;
  recovered: number;
  skippedExisting: number;
  skippedAutomated: number;
  errors: number;
};

function normalizeEmail(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function readEmailBody(record: InstantlyEmailRecord & Record<string, unknown>): string {
  const body = record.body as { text?: string; html?: string } | undefined;
  const chunks = [
    body?.text,
    record.body_text as string | undefined,
    body?.html,
    record.body_html as string | undefined,
    record.content_preview as string | undefined,
  ];
  return chunks
    .filter((value): value is string => Boolean(value?.trim()))
    .join("\n");
}

async function inboundAlreadyRecorded(
  campaignId: string,
  instantlyEmailId: string,
): Promise<boolean> {
  const client = createAiReplyAgentClient();
  const { data, error } = await client
    .from("ai_reply_agent_messages")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("instantly_email_id", instantlyEmailId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check inbound idempotency: ${error.message}`);
  }
  return Boolean(data?.id);
}

function buildSyntheticPayload(params: {
  record: InstantlyEmailRecord & Record<string, unknown>;
  campaignId: string;
  leadEmail: string;
  replyFromEmail: string | null;
}): InstantlyReplyWebhookPayload {
  const bodyText = readEmailBody(params.record);
  return {
    timestamp:
      params.record.timestamp_email ??
      params.record.timestamp_created ??
      new Date().toISOString(),
    event_type: "reply_received",
    campaign_id: params.campaignId,
    lead_email: params.leadEmail,
    email_id: params.record.id,
    email_account: params.record.eaccount,
    reply_subject: params.record.subject,
    reply_text: bodyText,
    reply_from_email: params.replyFromEmail ?? undefined,
    from_address_email: params.replyFromEmail ?? undefined,
  };
}

export async function sweepAlternateReplyInboxes(params: {
  campaignId: string;
  limit?: number;
}): Promise<AlternateReplySweepResult> {
  const config = await loadAiReplyConfig(params.campaignId);
  if (!config || config.status !== "waiting_for_replies") {
    return {
      scanned: 0,
      recovered: 0,
      skippedExisting: 0,
      skippedAutomated: 0,
      errors: 0,
    };
  }

  const apiKey = getInstantlyApiKey();
  const limit = params.limit ?? 40;
  const received = await listEmails(apiKey, {
    campaignId: params.campaignId,
    emailType: "received",
    limit,
  });

  const result: AlternateReplySweepResult = {
    scanned: received.length,
    recovered: 0,
    skippedExisting: 0,
    skippedAutomated: 0,
    errors: 0,
  };

  for (const record of received) {
    const emailId = record.id?.trim();
    const leadEmail = normalizeEmail(record.lead);
    if (!emailId || !leadEmail) {
      continue;
    }

    const fromAddress = normalizeEmail(
      (record as InstantlyEmailRecord & { from_address_email?: string })
        .from_address_email,
    );
    const alternateSender = Boolean(fromAddress && fromAddress !== leadEmail);

    if (!alternateSender) {
      continue;
    }
    if (isAutomatedSenderEmail(fromAddress)) {
      result.skippedAutomated += 1;
      continue;
    }

    if (await inboundAlreadyRecorded(params.campaignId, emailId)) {
      result.skippedExisting += 1;
      continue;
    }

    const replyFromEmail = await resolveReplyFromEmail(apiKey, {
      payload: {
        from_address_email: fromAddress,
        reply_text: readEmailBody(record as InstantlyEmailRecord & Record<string, unknown>),
      },
      leadEmail,
      instantlyEmailId: emailId,
    });

    try {
      const synthetic = buildSyntheticPayload({
        record: record as InstantlyEmailRecord & Record<string, unknown>,
        campaignId: params.campaignId,
        leadEmail,
        replyFromEmail,
      });
      const handled = await handleInstantlyReply(synthetic);
      if (handled.ok && handled.aiStatus === "auto_replied") {
        result.recovered += 1;
      } else if (handled.ok) {
        result.recovered += 1;
      } else {
        result.errors += 1;
      }
    } catch {
      result.errors += 1;
    }
  }

  return result;
}
