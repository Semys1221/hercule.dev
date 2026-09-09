import { instantlyFetch } from "@/lib/instantly";

import type { DomainVitals } from "@/lib/admin/deliverability/types";

const WARMUP_CHUNK = 100;
const DAILY_CHUNK = 200;
const VITALS_CHUNK = 50;

export type InstantlyAccountRecord = {
  email: string;
  status: number;
  warmup_status: number;
  daily_limit?: number | null;
};

type AccountsListPage = {
  items?: InstantlyAccountRecord[];
  next_starting_after?: string;
};

type WarmupAnalyticsResponse = {
  email_date_data?: Record<
    string,
    Record<string, { sent?: number; landed_inbox?: number; landed_spam?: number; received?: number }>
  >;
  aggregate_data?: Record<
    string,
    {
      sent?: number;
      received?: number;
      landed_inbox?: number;
      landed_spam?: number;
      health_score?: number;
      health_score_label?: string;
    }
  >;
};

type VitalsResponse = {
  status?: string;
  success_list?: Array<{
    domain?: string;
    allPass?: boolean;
    mx?: boolean;
    spf?: boolean;
    dkim?: boolean;
    dmarc?: boolean;
  }>;
  failure_list?: Array<{
    domain?: string;
    allPass?: boolean;
    mx?: boolean;
    spf?: boolean;
    dkim?: boolean;
    dmarc?: boolean;
  }>;
};

export type DailyAccountAnalyticsRow = {
  date: string;
  email_account: string;
  sent: number;
  bounced: number;
  contacted: number;
  new_leads_contacted: number;
  opened: number;
  unique_opened: number;
  replies: number;
  unique_replies: number;
  replies_automatic: number;
  unique_replies_automatic: number;
  clicks: number;
  unique_clicks: number;
};

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function encodeEmailPath(email: string): string {
  return encodeURIComponent(email.trim());
}

export async function listAllInstantlyAccounts(apiKey: string): Promise<InstantlyAccountRecord[]> {
  const items: InstantlyAccountRecord[] = [];
  let startingAfter: string | null = null;

  while (true) {
    const query = new URLSearchParams({ limit: "100" });
    if (startingAfter) query.set("starting_after", startingAfter);

    const page = await instantlyFetch<AccountsListPage>(
      apiKey,
      `/accounts?${query.toString()}`,
      { method: "GET" },
    );

    const pageItems = page.items ?? [];
    for (const item of pageItems) {
      if (item.email?.trim()) {
        items.push(item);
      }
    }

    const next =
      page.next_starting_after ??
      (pageItems.length > 0 ? pageItems[pageItems.length - 1]?.email ?? null : null);
    if (!next || pageItems.length < 100) break;
    startingAfter = next;
  }

  return items;
}

export async function fetchWarmupAnalytics(
  apiKey: string,
  emails: string[],
): Promise<WarmupAnalyticsResponse> {
  if (emails.length === 0) {
    return { email_date_data: {}, aggregate_data: {} };
  }

  const merged: WarmupAnalyticsResponse = {
    email_date_data: {},
    aggregate_data: {},
  };

  for (const chunk of chunkArray(emails, WARMUP_CHUNK)) {
    const page = await instantlyFetch<WarmupAnalyticsResponse>(
      apiKey,
      "/accounts/warmup-analytics",
      {
        method: "POST",
        body: JSON.stringify({ emails: chunk }),
      },
    );

    Object.assign(merged.email_date_data ?? {}, page.email_date_data ?? {});
    Object.assign(merged.aggregate_data ?? {}, page.aggregate_data ?? {});
  }

  return merged;
}

export async function fetchDailyAccountAnalytics(
  apiKey: string,
  emails: string[],
  startDate: string,
  endDate: string,
): Promise<DailyAccountAnalyticsRow[]> {
  if (emails.length === 0) return [];

  const rows: DailyAccountAnalyticsRow[] = [];

  for (const chunk of chunkArray(emails, DAILY_CHUNK)) {
    const query = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    for (const email of chunk) {
      query.append("emails", email);
    }

    const page = await instantlyFetch<DailyAccountAnalyticsRow[]>(
      apiKey,
      `/accounts/analytics/daily?${query.toString()}`,
      { method: "GET" },
    );
    rows.push(...(page ?? []));
  }

  return rows;
}

export async function testAccountVitals(
  apiKey: string,
  emails: string[],
): Promise<Map<string, DomainVitals>> {
  const byDomain = new Map<string, DomainVitals>();
  if (emails.length === 0) return byDomain;

  for (const chunk of chunkArray(emails, VITALS_CHUNK)) {
    const response = await instantlyFetch<VitalsResponse>(
      apiKey,
      "/accounts/test/vitals",
      {
        method: "POST",
        body: JSON.stringify({ accounts: chunk }),
      },
    );

    const allEntries = [
      ...(response.success_list ?? []),
      ...(response.failure_list ?? []),
    ];

    for (const entry of allEntries) {
      const domain = entry.domain?.trim().toLowerCase();
      if (!domain) continue;
      byDomain.set(domain, {
        domain,
        allPass: Boolean(entry.allPass),
        mx: Boolean(entry.mx),
        spf: Boolean(entry.spf),
        dkim: Boolean(entry.dkim),
        dmarc: Boolean(entry.dmarc),
      });
    }
  }

  return byDomain;
}

export async function setInstantlyAccountState(
  apiKey: string,
  email: string,
  action: "pause" | "resume" | "enable_warmup" | "disable_warmup",
): Promise<unknown> {
  const normalized = email.trim();

  switch (action) {
    case "pause":
      return instantlyFetch(apiKey, `/accounts/${encodeEmailPath(normalized)}/pause`, {
        method: "POST",
      });
    case "resume":
      return instantlyFetch(apiKey, `/accounts/${encodeEmailPath(normalized)}/resume`, {
        method: "POST",
      });
    case "enable_warmup":
      return instantlyFetch(apiKey, "/accounts/warmup/enable", {
        method: "POST",
        body: JSON.stringify({ emails: [normalized] }),
      });
    case "disable_warmup":
      return instantlyFetch(apiKey, "/accounts/warmup/disable", {
        method: "POST",
        body: JSON.stringify({ emails: [normalized] }),
      });
    default:
      throw new Error(`Unsupported account action: ${action satisfies never}`);
  }
}

export function formatDateYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function dateRangeLastDays(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - Math.max(0, days - 1));
  return {
    startDate: formatDateYmd(start),
    endDate: formatDateYmd(end),
  };
}
