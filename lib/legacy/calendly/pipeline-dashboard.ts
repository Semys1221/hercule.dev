import {
  classifyPipelineInvitee,
  type PipelineInviteeSegment,
  type PipelineNiche,
} from "@/lib/legacy/calendly/pipeline-classify";
import {
  isCalendlyBookingCanceled,
  type CalendlyBookingRow,
} from "@/lib/legacy/calendly/list-bookings";

export const PIPELINE_AVG_BASKET_EUR = 1500;
export const PIPELINE_CLOSING_RATE = 0.2;
export const PIPELINE_PRODUCT_PRICE_EUR = 1200;
export const PIPELINE_REVENUE_PER_RDV_EUR =
  PIPELINE_AVG_BASKET_EUR * PIPELINE_CLOSING_RATE;
export const PIPELINE_MEETING_HOURS = 0.5;

export type PipelineBooking = {
  inviteeUri: string;
  name: string;
  email: string;
  startTime: string;
  niche: PipelineNiche;
  segment: PipelineInviteeSegment;
  isPast: boolean;
};

export type SegmentAggregate = {
  segment: PipelineInviteeSegment;
  count: number;
  caPotentielEur: number;
};

export type PipelineDashboardMetrics = {
  generatedAt: string;
  activeCount: number;
  pastCount: number;
  upcomingCount: number;
  pipelineLifetimeDays: number;
  firstStartTime: string | null;
  lastStartTime: string | null;
  rdvPerCalendarDay: number;
  rdvPerActiveDay: number;
  activeDays: number;
  calendarDays: number;
  prediction30Days: number;
  prediction22BusinessDays: number;
  closingHours: number;
  caPotentielEur: number;
  revenuePerHourEur: number;
  segmentAggregates: SegmentAggregate[];
  highlighted: {
    budgetUndefined: number;
    budget1000PlusIndependent: number;
    notIndependentComptable: number;
    notComptable: number;
  };
  dailyHistory: Array<{ date: string; count: number }>;
};

function parisDateKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function isWeekdayParis(iso: string): boolean {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    weekday: "short",
  }).format(new Date(iso));
  return weekday !== "Sat" && weekday !== "Sun";
}

function daysBetweenInclusive(startIso: string, endIso: string): number {
  const start = new Date(`${parisDateKey(startIso)}T12:00:00Z`);
  const end = new Date(`${parisDateKey(endIso)}T12:00:00Z`);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1);
}

export function toPipelineBookings(
  rows: CalendlyBookingRow[],
  niche: PipelineNiche,
  now: Date = new Date(),
): PipelineBooking[] {
  const nowMs = now.getTime();
  return rows
    .filter((row) => !isCalendlyBookingCanceled(row))
    .map((row) => ({
      inviteeUri: row.invitee_uri,
      name: row.name,
      email: row.email,
      startTime: row.start_time,
      niche,
      segment: classifyPipelineInvitee(niche, row.questions),
      isPast: new Date(row.start_time).getTime() < nowMs,
    }));
}

export function mergePipelineBookings(
  comptable: PipelineBooking[],
  cif: PipelineBooking[],
): PipelineBooking[] {
  const byUri = new Map<string, PipelineBooking>();
  for (const booking of [...comptable, ...cif]) {
    if (!booking.inviteeUri) {
      continue;
    }
    byUri.set(booking.inviteeUri, booking);
  }
  return [...byUri.values()].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );
}

export function computePipelineMetrics(
  bookings: PipelineBooking[],
  now: Date = new Date(),
): PipelineDashboardMetrics {
  const activeCount = bookings.length;
  const pastCount = bookings.filter((booking) => booking.isPast).length;
  const upcomingCount = activeCount - pastCount;

  const firstStartTime = bookings[0]?.startTime ?? null;
  const lastStartTime = bookings[bookings.length - 1]?.startTime ?? null;

  const pipelineLifetimeDays =
    firstStartTime && lastStartTime
      ? daysBetweenInclusive(firstStartTime, lastStartTime)
      : 0;

  const dailyCounts = new Map<string, number>();
  for (const booking of bookings) {
    const key = parisDateKey(booking.startTime);
    dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
  }

  const dailyHistory = [...dailyCounts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, count]) => ({ date, count }));

  const activeDays = dailyHistory.length;
  const calendarDays = pipelineLifetimeDays || 0;
  const rdvPerActiveDay = activeDays > 0 ? activeCount / activeDays : 0;
  const rdvPerCalendarDay =
    calendarDays > 0 ? activeCount / calendarDays : 0;

  const businessDaysInWindow =
    firstStartTime && lastStartTime
      ? bookings
          .map((booking) => parisDateKey(booking.startTime))
          .filter((date, index, all) => all.indexOf(date) === index)
          .filter((date) => isWeekdayParis(`${date}T12:00:00Z`)).length
      : 0;

  const closingHours = activeCount * PIPELINE_MEETING_HOURS;
  const caPotentielEur = activeCount * PIPELINE_REVENUE_PER_RDV_EUR;
  const revenuePerHourEur =
    closingHours > 0 ? caPotentielEur / closingHours : 0;

  const segmentMap = new Map<string, SegmentAggregate>();
  for (const booking of bookings) {
    const existing = segmentMap.get(booking.segment.segmentKey);
    if (existing) {
      existing.count += 1;
      existing.caPotentielEur += PIPELINE_REVENUE_PER_RDV_EUR;
      continue;
    }
    segmentMap.set(booking.segment.segmentKey, {
      segment: booking.segment,
      count: 1,
      caPotentielEur: PIPELINE_REVENUE_PER_RDV_EUR,
    });
  }

  const segmentAggregates = [...segmentMap.values()].sort(
    (left, right) => right.count - left.count,
  );

  const highlighted = {
    budgetUndefined: bookings.filter(
      (booking) => booking.segment.budgetTier === "undefined",
    ).length,
    budget1000PlusIndependent: bookings.filter(
      (booking) =>
        booking.segment.budgetTier === "1000plus" &&
        booking.segment.isIndependent,
    ).length,
    notIndependentComptable: bookings.filter(
      (booking) =>
        !booking.segment.isIndependent && booking.segment.isComptable,
    ).length,
    notComptable: bookings.filter((booking) => !booking.segment.isComptable)
      .length,
  };

  return {
    generatedAt: now.toISOString(),
    activeCount,
    pastCount,
    upcomingCount,
    pipelineLifetimeDays,
    firstStartTime,
    lastStartTime,
    rdvPerCalendarDay,
    rdvPerActiveDay,
    activeDays,
    calendarDays,
    prediction30Days: rdvPerActiveDay * 30,
    prediction22BusinessDays:
      businessDaysInWindow > 0
        ? (activeCount / businessDaysInWindow) * 22
        : rdvPerActiveDay * 22,
    closingHours,
    caPotentielEur,
    revenuePerHourEur,
    segmentAggregates,
    highlighted,
    dailyHistory,
  };
}
