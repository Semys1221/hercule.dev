import {
  fetchWarmupAnalytics,
  listAllInstantlyAccounts,
  testAccountVitals,
  type InstantlyAccountRecord,
} from "@/lib/admin/deliverability/instantly-accounts";
import {
  accountStatusLabel,
  aggregateWarmupFromDaily,
  computeInboxRate,
  computeSpamRate,
  extractDomain,
  scoreAccountHealth,
  warmupStatusLabel,
} from "@/lib/admin/deliverability/scoring";
import type {
  DeliverabilityAccountRow,
  DeliverabilityDailySeriesPoint,
  DeliverabilitySettings,
  DeliverabilitySnapshot,
  DeliverabilitySnapshotKpis,
  DomainVitals,
  WarmupAggregate,
} from "@/lib/admin/deliverability/types";

function normalizeWarmupAggregate(
  email: string,
  aggregateData: Record<
    string,
    {
      sent?: number;
      received?: number;
      landed_inbox?: number;
      landed_spam?: number;
      health_score?: number;
      health_score_label?: string;
    }
  >,
  emailDateData: Record<
    string,
    Record<string, { sent?: number; landed_inbox?: number; landed_spam?: number; received?: number }>
  >,
): WarmupAggregate {
  const aggregate = aggregateData[email];
  if (aggregate) {
    const landedInbox = aggregate.landed_inbox ?? 0;
    const landedSpam = aggregate.landed_spam ?? 0;
    return {
      sent: aggregate.sent ?? 0,
      received: aggregate.received ?? 0,
      landedInbox,
      landedSpam,
      healthScore: aggregate.health_score ?? null,
      healthScoreLabel: aggregate.health_score_label ?? null,
      inboxRate: computeInboxRate({ landedInbox, landedSpam }),
    };
  }

  const daily = emailDateData[email] ?? {};
  return aggregateWarmupFromDaily(daily);
}

function buildPlacementSeries(
  emailDateData: Record<
    string,
    Record<string, { sent?: number; landed_inbox?: number; landed_spam?: number; received?: number }>
  >,
): DeliverabilityDailySeriesPoint[] {
  const byDate = new Map<string, DeliverabilityDailySeriesPoint>();

  for (const daily of Object.values(emailDateData)) {
    for (const [date, point] of Object.entries(daily)) {
      const current = byDate.get(date) ?? { date, inbox: 0, spam: 0, sent: 0 };
      current.inbox += point.landed_inbox ?? 0;
      current.spam += point.landed_spam ?? 0;
      current.sent += point.sent ?? 0;
      byDate.set(date, current);
    }
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function buildKpis(
  accounts: DeliverabilityAccountRow[],
  vitalsByDomain: Map<string, DomainVitals>,
): DeliverabilitySnapshotKpis {
  const healthScores = accounts
    .map((row) => row.warmup.healthScore)
    .filter((value): value is number => value !== null);
  const inboxRates = accounts
    .map((row) => row.warmup.inboxRate)
    .filter((value): value is number => value !== null);
  const spamRates = accounts
    .map((row) => computeSpamRate(row.warmup))
    .filter((value): value is number => value !== null);

  const dnsFailureDomains = [...vitalsByDomain.values()].filter((v) => !v.allPass).length;

  return {
    totalAccounts: accounts.length,
    activeAccounts: accounts.filter((row) => row.status === 1).length,
    averageHealthScore:
      healthScores.length > 0
        ? Math.round(
            healthScores.reduce((sum, value) => sum + value, 0) / healthScores.length,
          )
        : null,
    averageInboxRate:
      inboxRates.length > 0
        ? inboxRates.reduce((sum, value) => sum + value, 0) / inboxRates.length
        : null,
    averageSpamRate:
      spamRates.length > 0
        ? spamRates.reduce((sum, value) => sum + value, 0) / spamRates.length
        : null,
    dnsFailureDomains,
    criticalCount: accounts.filter((row) => row.health === "critical").length,
    watchCount: accounts.filter((row) => row.health === "watch").length,
    pausedCount: accounts.filter((row) => row.health === "paused").length,
    errorCount: accounts.filter((row) => row.health === "error").length,
  };
}

function mapAccountRow(
  account: InstantlyAccountRecord,
  settings: DeliverabilitySettings,
  warmupAnalytics: Awaited<ReturnType<typeof fetchWarmupAnalytics>>,
  vitalsByDomain: Map<string, DomainVitals>,
  excludedSet: Set<string>,
): DeliverabilityAccountRow {
  const email = account.email.trim();
  const domain = extractDomain(email);
  const excluded = excludedSet.has(email.toLowerCase());
  const warmup = normalizeWarmupAggregate(
    email,
    warmupAnalytics.aggregate_data ?? {},
    warmupAnalytics.email_date_data ?? {},
  );
  const vitals = vitalsByDomain.get(domain) ?? null;

  return {
    email,
    domain,
    status: account.status,
    statusLabel: accountStatusLabel(account.status),
    warmupStatus: account.warmup_status,
    warmupStatusLabel: warmupStatusLabel(account.warmup_status),
    dailyLimit: account.daily_limit ?? null,
    warmup,
    vitals,
    health: scoreAccountHealth({
      status: account.status,
      warmupStatus: account.warmup_status,
      warmup,
      vitals,
      settings,
    }),
    excluded,
  };
}

export async function buildDeliverabilitySnapshot(input: {
  apiKey: string;
  settings: DeliverabilitySettings;
  includeVitals?: boolean;
}): Promise<DeliverabilitySnapshot> {
  const { apiKey, settings, includeVitals = false } = input;
  const fetchedAt = new Date().toISOString();

  const rawAccounts = await listAllInstantlyAccounts(apiKey);
  const excludedSet = new Set(settings.excluded_emails.map((email) => email.toLowerCase()));
  const activeEmails = rawAccounts
    .map((account) => account.email.trim())
    .filter((email) => !excludedSet.has(email.toLowerCase()));

  const warmupAnalytics = await fetchWarmupAnalytics(apiKey, activeEmails);

  let vitalsByDomain = new Map<string, DomainVitals>();
  let vitalsCheckedAt: string | null = null;
  if (includeVitals) {
    vitalsByDomain = await testAccountVitals(apiKey, activeEmails);
    vitalsCheckedAt = fetchedAt;
  }

  const accounts = rawAccounts
    .map((account) =>
      mapAccountRow(account, settings, warmupAnalytics, vitalsByDomain, excludedSet),
    )
    .sort((a, b) => a.email.localeCompare(b.email));

  const placementSeries = buildPlacementSeries(warmupAnalytics.email_date_data ?? {});

  return {
    fetchedAt,
    cached: false,
    settings,
    kpis: buildKpis(accounts, vitalsByDomain),
    placementSeries,
    accounts,
    vitalsCheckedAt,
  };
}
