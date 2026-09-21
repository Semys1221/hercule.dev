import { BLOCKED_DAY_COUNT } from "./sales-calendrier-dates";

export const GRID_GAP_PX = 4;
export const GRID_CELL_COUNT = 42;
export const FALLBACK_CELL_SIZE_PX = 72;
export const VISIBLE_WEEKS = 5;
export const CAPTION_HEIGHT_PX = 40;
export const WEEKDAY_ROW_HEIGHT_PX = 28;
export const IDLE_SAFETY_MS = 2000;

export const REVEAL = {
  CALENDAR_MS: 100,
  DOMINO_STAGGER_S: 0.035,
  DOMINO_DURATION_S: 0.25,
  DOMINO_BUFFER_MS: 200,
  TODAY_RING_MS: 300,
  BLOCKED_STAGGER_S: 0.08,
  BLOCKED_DURATION_S: 0.35,
  SCROLL_BUFFER_MS: 400,
  SCROLL_ANIMATION_MS: 500,
  BOOKING_START_BUFFER_MS: 400,
  BOOKING_STAGGER_S: 0.7,
  COMPLETE_BUFFER_MS: 300,
} as const;

export const DOMINO_MS =
  (GRID_CELL_COUNT * REVEAL.DOMINO_STAGGER_S + REVEAL.DOMINO_DURATION_S) * 1000;
export const BLOCKED_ANIMATION_MS =
  (BLOCKED_DAY_COUNT * REVEAL.BLOCKED_STAGGER_S + REVEAL.BLOCKED_DURATION_S) * 1000;

export type RevealPhase =
  | "idle"
  | "calendar"
  | "today"
  | "grayed"
  | "scrolled"
  | "booking"
  | "complete";

const PHASE_RANK: Record<RevealPhase, number> = {
  idle: 0,
  calendar: 1,
  today: 2,
  grayed: 3,
  scrolled: 4,
  booking: 5,
  complete: 6,
};

export function phaseAtLeast(phase: RevealPhase, target: RevealPhase): boolean {
  return PHASE_RANK[phase] >= PHASE_RANK[target];
}

export function getRevealSchedule(meetingCount: number) {
  const todayMs = REVEAL.CALENDAR_MS + DOMINO_MS + REVEAL.DOMINO_BUFFER_MS;
  const grayedMs = todayMs + REVEAL.TODAY_RING_MS;
  const scrollMs = grayedMs + BLOCKED_ANIMATION_MS + REVEAL.SCROLL_BUFFER_MS;
  const bookingMs =
    scrollMs + REVEAL.SCROLL_ANIMATION_MS + REVEAL.BOOKING_START_BUFFER_MS;
  const completeMs =
    bookingMs +
    meetingCount * REVEAL.BOOKING_STAGGER_S * 1000 +
    REVEAL.COMPLETE_BUFFER_MS;

  return {
    calendarMs: REVEAL.CALENDAR_MS,
    todayMs,
    grayedMs,
    scrollMs,
    bookingMs,
    completeMs,
  };
}
