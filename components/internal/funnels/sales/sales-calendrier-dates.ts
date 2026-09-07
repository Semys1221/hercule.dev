import type { PresetOpportunityCard } from "@/lib/admin/funnels/sales-preset-registry";

export const BLOCKED_DAY_COUNT = 8;

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, days: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isWeekend(date: Date): boolean {
  const weekday = date.getDay();
  return weekday === 0 || weekday === 6;
}

export function nextWeekday(date: Date): Date {
  let cursor = startOfDay(date);
  while (isWeekend(cursor)) {
    cursor = addDays(cursor, 1);
  }
  return cursor;
}

/** `count` consecutive calendar days starting the day after `from`. */
export function blockedDaysFromToday(from: Date, count: number): Date[] {
  const start = addDays(startOfDay(from), 1);
  return Array.from({ length: count }, (_, index) => addDays(start, index));
}

export type CalendarMeeting = {
  cardId: string;
  label: string;
  secteur: string;
  date: Date;
};

/** Monday-based weekday: 0 = Monday, 6 = Sunday. */
function mondayBasedWeekday(date: Date): number {
  const weekday = date.getDay();
  return weekday === 0 ? 6 : weekday - 1;
}

/**
 * Weeks to scroll up so today's week sits at the top of the month grid
 * (Monday-first, matching `locale: fr`).
 */
export function calendarScrollWeeksBeforeToday(today: Date, month: Date): number {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = addDays(firstOfMonth, -mondayBasedWeekday(firstOfMonth));
  const daysSinceGridStart = Math.round(
    (startOfDay(today).getTime() - gridStart.getTime()) / (24 * 60 * 60 * 1000),
  );
  return Math.max(0, Math.floor(daysSinceGridStart / 7));
}

/** Index 0-based in the Monday-first month grid (includes outside days). */
export function calendarGridRevealIndex(day: Date, month: Date): number {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = addDays(firstOfMonth, -mondayBasedWeekday(firstOfMonth));
  return Math.round(
    (startOfDay(day).getTime() - gridStart.getTime()) / (24 * 60 * 60 * 1000),
  );
}

/** Index 0-based week row in the Monday-first month grid (includes outside days). */
export function calendarWeekIndex(day: Date, month: Date): number {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = addDays(firstOfMonth, -mondayBasedWeekday(firstOfMonth));
  const daysSinceGridStart = Math.round(
    (startOfDay(day).getTime() - gridStart.getTime()) / (24 * 60 * 60 * 1000),
  );
  return Math.floor(daysSinceGridStart / 7);
}

/**
 * Scroll weeks so today's week stays near the top while the latest meeting
 * remains inside the visible week window.
 */
export function calendarScrollWeeksForMeetings(
  today: Date,
  month: Date,
  meetingDates: Date[],
  visibleWeeks: number,
): number {
  const todayWeeks = calendarScrollWeeksBeforeToday(today, month);
  if (meetingDates.length === 0) {
    return todayWeeks;
  }

  const lastMeetingWeek = meetingDates.reduce(
    (max, date) => Math.max(max, calendarWeekIndex(date, month)),
    0,
  );
  const scrollForLastMeeting = Math.max(0, lastMeetingWeek - visibleWeeks + 1);
  return Math.min(todayWeeks, scrollForLastMeeting);
}

export function bookMeetingsFromCards(
  cards: Array<
    Pick<PresetOpportunityCard, "id" | "secteur" | "minDaysOffset" | "maxDaysOffset">
  >,
  from: Date,
): CalendarMeeting[] {
  const occupied = new Set<string>();
  const meetings: CalendarMeeting[] = [];

  for (const card of cards) {
    const offset = Math.round((card.minDaysOffset + card.maxDaysOffset) / 2);
    let date = nextWeekday(addDays(from, offset));
    let key = dateKey(date);

    while (occupied.has(key)) {
      date = nextWeekday(addDays(date, 1));
      key = dateKey(date);
    }

    occupied.add(key);
    meetings.push({
      cardId: card.id,
      label: card.secteur,
      secteur: card.secteur,
      date,
    });
  }

  return meetings;
}
