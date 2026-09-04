import { instantlyFetch } from "@/lib/instantly";

import type { InstantlyEmailRecord, InstantlyLeadRecord } from "./types";

const INSTANTLY_API_BASE = "https://api.instantly.ai/api/v2";

export function getInstantlyApiKey(): string {
  const key = process.env.INSTANTLY_API_KEY?.trim();
  if (!key) {
    throw new Error("INSTANTLY_API_KEY is not set");
  }
  return key;
}

export type ListEmailsParams = {
  search?: string;
  campaignId?: string;
  emailType?: "sent" | "received" | "manual";
  latestOfThread?: boolean;
  limit?: number;
};

export async function listEmails(
  apiKey: string,
  params: ListEmailsParams = {},
): Promise<InstantlyEmailRecord[]> {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.campaignId) query.set("campaign_id", params.campaignId);
  if (params.emailType) query.set("email_type", params.emailType);
  if (params.latestOfThread) query.set("latest_of_thread", "true");

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const page = await instantlyFetch<{ items?: InstantlyEmailRecord[] }>(
    apiKey,
    `/emails${suffix}`,
    { method: "GET" },
  );
  return page.items ?? [];
}

export async function findLeadByEmailInCampaign(
  apiKey: string,
  campaignId: string,
  leadEmail: string,
): Promise<InstantlyLeadRecord | null> {
  const normalized = leadEmail.trim().toLowerCase();
  let startingAfter: string | null = null;

  while (true) {
    const body: Record<string, unknown> = {
      campaign: campaignId,
      limit: 100,
    };
    if (startingAfter) body.starting_after = startingAfter;

    const page = await instantlyFetch<{
      items?: InstantlyLeadRecord[];
      next_starting_after?: string;
    }>(apiKey, "/leads/list", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const items = page.items ?? [];
    const match =
      items.find((item) => (item.email ?? "").trim().toLowerCase() === normalized) ??
      null;
    if (match) return match;

    const next =
      page.next_starting_after ??
      (items.length > 0 ? (items[items.length - 1]?.id ?? null) : null);
    if (!next || items.length < 100) break;
    startingAfter = next;
  }

  return null;
}

export async function removeLeadFromSubsequence(
  apiKey: string,
  leadId: string,
): Promise<unknown> {
  return instantlyFetch(apiKey, "/leads/subsequence/remove", {
    method: "POST",
    body: JSON.stringify({ id: leadId }),
  });
}

export type ReplyToEmailParams = {
  eaccount: string;
  replyToUuid: string;
  subject: string;
  html: string;
};

export async function replyToEmail(
  apiKey: string,
  params: ReplyToEmailParams,
): Promise<unknown> {
  return instantlyFetch(apiKey, "/emails/reply", {
    method: "POST",
    body: JSON.stringify({
      eaccount: params.eaccount,
      reply_to_uuid: params.replyToUuid,
      subject: params.subject,
      body: { html: params.html },
    }),
  });
}

export type UpdateInterestStatusParams = {
  lead_email: string;
  interest_value: number | null;
  campaign_id?: string;
  disable_auto_interest?: boolean;
};

export async function updateLeadInterestStatusBypass(
  apiKey: string,
  params: UpdateInterestStatusParams,
): Promise<unknown> {
  return instantlyFetch(apiKey, "/leads/update-interest-status", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export type InstantlyWebhookRecord = {
  id?: string;
  name?: string | null;
  target_hook_url?: string;
  event_type?: string | null;
  campaign?: string | null;
  status?: number | null;
};

export async function listWebhooks(apiKey: string): Promise<InstantlyWebhookRecord[]> {
  const items: InstantlyWebhookRecord[] = [];
  let startingAfter: string | null = null;
  const pageSize = 100;

  while (true) {
    const params = new URLSearchParams({ limit: String(pageSize) });
    if (startingAfter) params.set("starting_after", startingAfter);

    const page = await instantlyFetch<{
      items?: InstantlyWebhookRecord[];
      next_starting_after?: string;
    }>(apiKey, `/webhooks?${params.toString()}`, { method: "GET" });

    const pageItems = page.items ?? [];
    items.push(...pageItems);

    const next =
      page.next_starting_after ??
      (pageItems.length > 0 ? (pageItems[pageItems.length - 1]?.id ?? null) : null);
    if (!next || pageItems.length < pageSize) break;
    startingAfter = next;
  }

  return items;
}

export type CreateWebhookParams = {
  target_hook_url: string;
  event_type: string;
  name?: string;
  campaign?: string | null;
  headers?: Record<string, string>;
};

export async function createWebhook(
  apiKey: string,
  params: CreateWebhookParams,
): Promise<InstantlyWebhookRecord> {
  return instantlyFetch<InstantlyWebhookRecord>(apiKey, "/webhooks", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function deleteWebhook(apiKey: string, webhookId: string): Promise<void> {
  await instantlyFetch(apiKey, `/webhooks/${webhookId}`, { method: "DELETE" });
}

export type InstantlySubsequenceRecord = {
  id?: string;
  name?: string;
  parent_campaign?: string;
  status?: number;
};

export async function listSubsequences(
  apiKey: string,
  campaignId?: string,
): Promise<InstantlySubsequenceRecord[]> {
  const query = campaignId ? `?parent_campaign=${campaignId}&limit=100` : "?limit=100";
  const page = await instantlyFetch<{ items?: InstantlySubsequenceRecord[] }>(
    apiKey,
    `/subsequences${query}`,
    { method: "GET" },
  );
  return page.items ?? [];
}

export async function listCampaignLeads(
  apiKey: string,
  campaignId: string,
  startingAfter?: string | null,
): Promise<{ items: InstantlyLeadRecord[]; nextStartingAfter: string | null }> {
  const body: Record<string, unknown> = {
    campaign: campaignId,
    limit: 100,
  };
  if (startingAfter) body.starting_after = startingAfter;

  const page = await instantlyFetch<{
    items?: InstantlyLeadRecord[];
    next_starting_after?: string;
  }>(apiKey, "/leads/list", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const items = page.items ?? [];
  const next =
    page.next_starting_after ??
    (items.length > 0 ? (items[items.length - 1]?.id ?? null) : null);

  return { items, nextStartingAfter: next };
}

export async function listCampaigns(
  apiKey: string,
): Promise<Array<{ id?: string; name?: string }>> {
  const items: Array<{ id?: string; name?: string }> = [];
  let startingAfter: string | null = null;

  while (true) {
    const query = new URLSearchParams({ limit: "100" });
    if (startingAfter) query.set("starting_after", startingAfter);
    const page = await instantlyFetch<{
      items?: Array<{ id?: string; name?: string }>;
      next_starting_after?: string;
    }>(apiKey, `/campaigns?${query.toString()}`, { method: "GET" });

    const pageItems = page.items ?? [];
    items.push(...pageItems);

    const next =
      page.next_starting_after ??
      (pageItems.length > 0 ? (pageItems[pageItems.length - 1]?.id ?? null) : null);
    if (!next || pageItems.length < 100) break;
    startingAfter = next;
  }

  return items;
}

export { INSTANTLY_API_BASE };
