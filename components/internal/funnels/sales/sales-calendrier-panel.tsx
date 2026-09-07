"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { fr } from "date-fns/locale";

import { composeOpportunityCards } from "@/lib/admin/funnels/compose-opportunity-cards";
import { scoreAgencyPresets } from "@/lib/admin/funnels/sales-preset-scoring";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import { getSecteurConfig } from "@/lib/agence/secteur-config";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { SalesClosingValues } from "./sales-closing-sections";
import {
  blockedDaysFromToday,
  bookMeetingsFromCards,
  calendarGridRevealIndex,
  calendarScrollWeeksBeforeToday,
  dateKey,
  BLOCKED_DAY_COUNT,
  type CalendarMeeting,
} from "./sales-calendrier-dates";

const GRID_GAP_PX = 4;
const GRID_CELL_COUNT = 42;
const FALLBACK_CELL_SIZE_PX = 72;
const VISIBLE_WEEKS = 5;
const CAPTION_HEIGHT_PX = 40;
const WEEKDAY_ROW_HEIGHT_PX = 28;

const REVEAL = {
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

function getRevealTimings(meetingCount: number) {
  const dominoMs =
    (GRID_CELL_COUNT * REVEAL.DOMINO_STAGGER_S + REVEAL.DOMINO_DURATION_S) * 1000;
  const blockedAnimationMs =
    (BLOCKED_DAY_COUNT * REVEAL.BLOCKED_STAGGER_S + REVEAL.BLOCKED_DURATION_S) *
    1000;

  const calendarMs = REVEAL.CALENDAR_MS;
  const todayMs = calendarMs + dominoMs + REVEAL.DOMINO_BUFFER_MS;
  const grayedMs = todayMs + REVEAL.TODAY_RING_MS;
  const scrollMs = grayedMs + blockedAnimationMs + REVEAL.SCROLL_BUFFER_MS;
  const bookingMs =
    scrollMs + REVEAL.SCROLL_ANIMATION_MS + REVEAL.BOOKING_START_BUFFER_MS;
  const completeAt =
    bookingMs +
    meetingCount * REVEAL.BOOKING_STAGGER_S * 1000 +
    REVEAL.COMPLETE_BUFFER_MS;

  return { calendarMs, todayMs, grayedMs, scrollMs, bookingMs, completeAt };
}

type RevealPhase =
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

function phaseAtLeast(phase: RevealPhase, target: RevealPhase): boolean {
  return PHASE_RANK[phase] >= PHASE_RANK[target];
}

type MeetingEntry = CalendarMeeting & { index: number };

type CalendrierAnimationValue = {
  phase: RevealPhase;
  month: Date;
  blockedKeys: Map<string, number>;
  meetingByKey: Map<string, MeetingEntry>;
  scrollOffsetPx: number;
  reducedMotion: boolean;
};

const CalendrierAnimationContext = createContext<CalendrierAnimationValue | null>(null);

const CALENDRIER_CHECKBOX_LABEL =
  "Calendrier susceptible d'être modifié en fonction des disponibilités des deux parties";

const CALENDAR_CLASS_NAMES = {
  root: "w-full p-0",
  month: "w-full gap-2",
  month_caption: "h-auto px-0",
  month_grid: "w-full",
  weekdays: "grid grid-cols-7 w-full gap-1",
  weekday: "flex items-center justify-center text-center text-muted-foreground",
  week: "grid grid-cols-7 w-full gap-1 mt-1",
  day: "pointer-events-none aspect-square w-full min-w-0 p-0",
  day_button: "h-full w-full min-w-0 aspect-square",
  today: "rounded-md",
} as const;

type SalesCalendrierPanelProps = {
  qualificationValues: SalesQualificationValues;
  closingValues: SalesClosingValues;
  saving: boolean;
  persistTieDown: (patch: Partial<SalesClosingValues>) => Promise<void>;
};

function AnimatedDayButton({
  className,
  day,
  modifiers,
  ...props
}: ComponentProps<typeof CalendarDayButton>) {
  const ctx = useContext(CalendrierAnimationContext);
  const key = dateKey(day.date);
  const blockedIndex = ctx?.blockedKeys.get(key);
  const meeting = ctx?.meetingByKey.get(key);
  const reducedMotion = ctx?.reducedMotion ?? false;
  const phase = ctx?.phase ?? "idle";
  const month = ctx?.month ?? day.date;

  const revealIndex = calendarGridRevealIndex(day.date, month);
  const showDomino = Boolean(ctx && (phaseAtLeast(phase, "calendar") || reducedMotion));
  const showToday = Boolean(modifiers.today && ctx && phaseAtLeast(phase, "today"));
  const showBlocked =
    blockedIndex !== undefined && ctx && phaseAtLeast(phase, "grayed");
  const showMeeting = Boolean(meeting && ctx && phaseAtLeast(phase, "booking"));

  const secteurConfig = meeting
    ? getSecteurConfig(meeting.secteur, "internal")
    : null;
  const MeetingIcon = secteurConfig?.icon;

  const dominoVisible = { opacity: 1, scale: 1, y: 0 };
  const dominoHidden = { opacity: 0, scale: 0.88, y: -6 };

  return (
    <motion.div
      className="relative size-full"
      initial={reducedMotion ? false : dominoHidden}
      animate={showDomino ? dominoVisible : dominoHidden}
      transition={{
        delay:
          reducedMotion || !showDomino ? 0 : revealIndex * REVEAL.DOMINO_STAGGER_S,
        duration: reducedMotion || !showDomino ? 0 : REVEAL.DOMINO_DURATION_S,
        ease: "easeOut",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[10%] top-[35%] -bottom-0.5 -z-10 rounded-full bg-gradient-to-b from-black/55 to-transparent blur-[2px]"
      />
      <CalendarDayButton
        day={day}
        modifiers={modifiers}
        className={cn(
          className,
          "relative z-10 rounded-md border border-border bg-background hover:bg-background",
          showToday && "ring-2 ring-primary",
          showBlocked && "border-secondary text-transparent",
        )}
        {...props}
      />
      <AnimatePresence>
        {showBlocked && blockedIndex !== undefined ? (
          <motion.div
            key="blocked"
            className="pointer-events-none absolute inset-0 z-20 rounded-md bg-secondary"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: reducedMotion ? 0 : blockedIndex * REVEAL.BLOCKED_STAGGER_S,
              duration: reducedMotion ? 0 : REVEAL.BLOCKED_DURATION_S,
              ease: "easeOut",
            }}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {showMeeting && meeting && MeetingIcon ? (
          <motion.div
            key={meeting.cardId}
            aria-label={meeting.label}
            className="pointer-events-none absolute inset-x-1 bottom-1 z-30 flex justify-center"
            initial={reducedMotion ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: reducedMotion ? 0 : meeting.index * REVEAL.BOOKING_STAGGER_S,
              duration: reducedMotion ? 0 : 0.35,
              ease: "easeOut",
            }}
          >
            <MeetingIcon
              className={cn("size-5", secteurConfig?.iconClass)}
              strokeWidth={1.5}
              aria-hidden
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

const calendarComponents = { DayButton: AnimatedDayButton };

export function SalesCalendrierPanel({
  qualificationValues,
  closingValues,
  saving,
  persistTieDown,
}: SalesCalendrierPanelProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<RevealPhase>(reducedMotion ? "complete" : "idle");
  const [month, setMonth] = useState(() => new Date());
  const [cellSizePx, setCellSizePx] = useState(FALLBACK_CELL_SIZE_PX);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const introStartedRef = useRef(false);

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const presetResult = useMemo(
    () => scoreAgencyPresets(qualificationValues),
    [qualificationValues],
  );

  const cards = useMemo(
    () => composeOpportunityCards(qualificationValues, presetResult.id),
    [qualificationValues, presetResult.id],
  );

  const blockedDays = useMemo(
    () => blockedDaysFromToday(today, BLOCKED_DAY_COUNT),
    [today],
  );

  const meetings = useMemo(
    () => bookMeetingsFromCards(cards, today),
    [cards, today],
  );

  const blockedKeys = useMemo(() => {
    const map = new Map<string, number>();
    blockedDays.forEach((date, index) => {
      map.set(dateKey(date), index);
    });
    return map;
  }, [blockedDays]);

  const meetingByKey = useMemo(() => {
    const map = new Map<string, MeetingEntry>();
    meetings.forEach((meeting, index) => {
      map.set(dateKey(meeting.date), { ...meeting, index });
    });
    return map;
  }, [meetings]);

  const weeksBeforeToday = useMemo(
    () => calendarScrollWeeksBeforeToday(today, month),
    [today, month],
  );

  const scrollOffsetPx = weeksBeforeToday * (cellSizePx + GRID_GAP_PX);

  const calendarViewportHeight =
    CAPTION_HEIGHT_PX +
    WEEKDAY_ROW_HEIGHT_PX +
    VISIBLE_WEEKS * cellSizePx +
    (VISIBLE_WEEKS - 1) * GRID_GAP_PX;

  const animationValue = useMemo<CalendrierAnimationValue>(
    () => ({
      phase,
      month,
      blockedKeys,
      meetingByKey,
      scrollOffsetPx,
      reducedMotion,
    }),
    [blockedKeys, meetingByKey, month, phase, reducedMotion, scrollOffsetPx],
  );

  useEffect(() => {
    const element = calendarContainerRef.current;
    if (!element) {
      return undefined;
    }

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      const nextCellSize = (width - 6 * GRID_GAP_PX) / 7;
      if (nextCellSize > 0) {
        setCellSizePx(nextCellSize);
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setPhase("complete");
      return undefined;
    }

    if (introStartedRef.current) {
      return undefined;
    }
    introStartedRef.current = true;

    const { calendarMs, todayMs, grayedMs, scrollMs, bookingMs, completeAt } =
      getRevealTimings(meetings.length);

    const calendarTimer = window.setTimeout(() => setPhase("calendar"), calendarMs);
    const todayTimer = window.setTimeout(() => setPhase("today"), todayMs);
    const grayedTimer = window.setTimeout(() => setPhase("grayed"), grayedMs);
    const scrolledTimer = window.setTimeout(() => setPhase("scrolled"), scrollMs);
    const bookingTimer = window.setTimeout(() => setPhase("booking"), bookingMs);
    const completeTimer = window.setTimeout(() => setPhase("complete"), completeAt);

    return () => {
      window.clearTimeout(calendarTimer);
      window.clearTimeout(todayTimer);
      window.clearTimeout(grayedTimer);
      window.clearTimeout(scrolledTimer);
      window.clearTimeout(bookingTimer);
      window.clearTimeout(completeTimer);
    };
  }, [meetings.length, reducedMotion]);

  const showScrolled = phaseAtLeast(phase, "scrolled") || reducedMotion;

  return (
    <CalendrierAnimationContext.Provider value={animationValue}>
      <div className="flex flex-col gap-6">
        <div
          ref={calendarContainerRef}
          className="mx-auto w-full max-w-3xl overflow-hidden p-1"
          style={{ height: calendarViewportHeight + 8 }}
        >
          <motion.div
            animate={{ y: showScrolled ? -scrollOffsetPx : 0 }}
            transition={{
              duration: reducedMotion ? 0 : REVEAL.SCROLL_ANIMATION_MS / 1000,
              ease: "easeInOut",
            }}
          >
            <Calendar
              mode="single"
              locale={fr}
              month={month}
              onMonthChange={phase === "complete" ? setMonth : undefined}
              showOutsideDays
              fixedWeeks
              className="w-full !p-0"
              classNames={CALENDAR_CLASS_NAMES}
              components={calendarComponents}
            />
          </motion.div>
        </div>

        <AnimatePresence>
          {phase === "complete" ? (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.35, ease: "easeOut" }}
              className="flex items-start gap-3"
            >
              <Checkbox
                id="calendrierAccepted"
                checked={closingValues.calendrierAccepted}
                onCheckedChange={(checked) => {
                  void persistTieDown({ calendrierAccepted: checked === true });
                }}
                disabled={saving}
              />
              <Label
                htmlFor="calendrierAccepted"
                className="text-sm font-normal leading-relaxed"
              >
                {CALENDRIER_CHECKBOX_LABEL}
              </Label>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </CalendrierAnimationContext.Provider>
  );
}
