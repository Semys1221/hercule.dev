import { z } from "zod";

export const deliverabilityHealthSchema = z.enum([
  "healthy",
  "watch",
  "critical",
  "paused",
  "error",
  "no_warmup",
]);

export type DeliverabilityHealth = z.infer<typeof deliverabilityHealthSchema>;

export const accountStateActionSchema = z.enum([
  "pause",
  "resume",
  "enable_warmup",
  "disable_warmup",
  "test_vitals",
]);

export type AccountStateAction = z.infer<typeof accountStateActionSchema>;

export const deliverabilitySettingsSchema = z.object({
  health_score_warn_below: z.number().int().min(0).max(100),
  inbox_rate_warn_below: z.number().min(0).max(1),
  refresh_minutes: z.number().int().min(1).max(120),
  excluded_emails: z.array(z.string().email()),
  auto_pause_on_alert: z.boolean(),
});

export type DeliverabilitySettings = z.infer<typeof deliverabilitySettingsSchema>;

export const DEFAULT_DELIVERABILITY_SETTINGS: DeliverabilitySettings = {
  health_score_warn_below: 80,
  inbox_rate_warn_below: 0.85,
  refresh_minutes: 15,
  excluded_emails: [],
  auto_pause_on_alert: false,
};

export type DomainVitals = {
  domain: string;
  allPass: boolean;
  mx: boolean;
  spf: boolean;
  dkim: boolean;
  dmarc: boolean;
};

export type WarmupAggregate = {
  sent: number;
  received: number;
  landedInbox: number;
  landedSpam: number;
  healthScore: number | null;
  healthScoreLabel: string | null;
  inboxRate: number | null;
};

export type WarmupDailyPoint = {
  date: string;
  sent: number;
  landedInbox: number;
  landedSpam: number;
  received: number;
};

export type DeliverabilityAccountRow = {
  email: string;
  domain: string;
  status: number;
  statusLabel: string;
  warmupStatus: number;
  warmupStatusLabel: string;
  dailyLimit: number | null;
  warmup: WarmupAggregate;
  vitals: DomainVitals | null;
  health: DeliverabilityHealth;
  excluded: boolean;
};

export type DeliverabilityDailySeriesPoint = {
  date: string;
  inbox: number;
  spam: number;
  sent: number;
};

export type DeliverabilitySnapshotKpis = {
  totalAccounts: number;
  activeAccounts: number;
  averageHealthScore: number | null;
  averageInboxRate: number | null;
  averageSpamRate: number | null;
  dnsFailureDomains: number;
  criticalCount: number;
  watchCount: number;
  pausedCount: number;
  errorCount: number;
};

export type DeliverabilitySnapshot = {
  fetchedAt: string;
  cached: boolean;
  settings: DeliverabilitySettings;
  kpis: DeliverabilitySnapshotKpis;
  placementSeries: DeliverabilityDailySeriesPoint[];
  accounts: DeliverabilityAccountRow[];
  vitalsCheckedAt: string | null;
};
