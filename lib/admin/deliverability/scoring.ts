import type {
  DeliverabilityHealth,
  DeliverabilitySettings,
  DomainVitals,
  WarmupAggregate,
} from "@/lib/admin/deliverability/types";

export function extractDomain(email: string): string {
  const at = email.lastIndexOf("@");
  if (at <= 0) return email.toLowerCase();
  return email.slice(at + 1).toLowerCase();
}

export function computeInboxRate(warmup: Pick<WarmupAggregate, "landedInbox" | "landedSpam">): number | null {
  const total = warmup.landedInbox + warmup.landedSpam;
  if (total <= 0) return null;
  return warmup.landedInbox / total;
}

export function computeSpamRate(warmup: Pick<WarmupAggregate, "landedInbox" | "landedSpam">): number | null {
  const inboxRate = computeInboxRate(warmup);
  if (inboxRate === null) return null;
  return 1 - inboxRate;
}

export function accountStatusLabel(status: number): string {
  switch (status) {
    case 1:
      return "Active";
    case 2:
      return "Paused";
    case 3:
      return "Maintenance";
    case -1:
      return "Connection error";
    case -2:
      return "Soft bounce";
    case -3:
      return "Sending error";
    default:
      return `Status ${status}`;
  }
}

export function warmupStatusLabel(warmupStatus: number): string {
  switch (warmupStatus) {
    case 0:
      return "Warmup paused";
    case 1:
      return "Warmup active";
    case -1:
      return "Warmup banned";
    case -2:
      return "Warmup disabled";
    case -3:
      return "Warmup error";
    default:
      return `Warmup ${warmupStatus}`;
  }
}

export function scoreAccountHealth(input: {
  status: number;
  warmupStatus: number;
  warmup: WarmupAggregate;
  vitals: DomainVitals | null;
  settings: DeliverabilitySettings;
}): DeliverabilityHealth {
  const { status, warmupStatus, warmup, vitals, settings } = input;

  if (status < 0) return "error";
  if (status === 2 || status === 3) return "paused";
  if (warmupStatus !== 1) return "no_warmup";

  const inboxRate = computeInboxRate(warmup);
  const healthScore = warmup.healthScore;

  const vitalsFail = vitals !== null && !vitals.allPass;
  const lowHealth =
    healthScore !== null && healthScore < settings.health_score_warn_below;
  const lowInbox =
    inboxRate !== null && inboxRate < settings.inbox_rate_warn_below;

  if (vitalsFail || lowHealth || (lowInbox && (warmup.landedInbox + warmup.landedSpam) >= 5)) {
    return "critical";
  }

  if (
    lowInbox ||
    (healthScore !== null && healthScore < settings.health_score_warn_below + 5)
  ) {
    return "watch";
  }

  return "healthy";
}

export function aggregateWarmupFromDaily(
  daily: Record<string, { sent?: number; landed_inbox?: number; landed_spam?: number; received?: number }>,
): WarmupAggregate {
  let sent = 0;
  let received = 0;
  let landedInbox = 0;
  let landedSpam = 0;

  for (const point of Object.values(daily)) {
    sent += point.sent ?? 0;
    received += point.received ?? 0;
    landedInbox += point.landed_inbox ?? 0;
    landedSpam += point.landed_spam ?? 0;
  }

  return {
    sent,
    received,
    landedInbox,
    landedSpam,
    healthScore: null,
    healthScoreLabel: null,
    inboxRate: computeInboxRate({ landedInbox, landedSpam }),
  };
}
