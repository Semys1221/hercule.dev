"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { fr } from "date-fns/locale";

import { composeOpportunityCards } from "@/lib/admin/funnels/compose-opportunity-cards";
import type { ClientSegment } from "@/lib/admin/funnels/client-segment";
import { scoreAgencyPresets } from "@/lib/admin/funnels/sales-preset-scoring";
import type { Audience } from "@/lib/admin/navigation";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { SalesCalendrierBookingLegend } from "./sales-calendrier-booking-legend";
import {
  CalendrierDataContext,
  CalendrierPhaseContext,
  type MeetingEntry,
} from "./sales-calendrier-context";
import { calendarDayButtonComponents } from "./sales-calendrier-day-button";
import {
  blockedDaysFromToday,
  bookMeetingsFromCards,
  calendarScrollWeeksForMeetings,
  dateKey,
  BLOCKED_DAY_COUNT,
} from "./sales-calendrier-dates";
import {
  CAPTION_HEIGHT_PX,
  FALLBACK_CELL_SIZE_PX,
  getRevealSchedule,
  GRID_GAP_PX,
  IDLE_SAFETY_MS,
  phaseAtLeast,
  type RevealPhase,
  VISIBLE_WEEKS,
  WEEKDAY_ROW_HEIGHT_PX,
  REVEAL,
} from "./sales-calendrier-reveal";
import type { SalesClosingValues } from "./sales-closing-sections";

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
  audience: Audience;
  qualificationValues: SalesQualificationValues;
  closingValues: SalesClosingValues;
  saving: boolean;
  persistTieDown: (patch: Partial<SalesClosingValues>) => Promise<void>;
  clientSegment?: ClientSegment;
};

export function SalesCalendrierPanel({
  audience,
  qualificationValues,
  closingValues,
  saving,
  persistTieDown,
  clientSegment,
}: SalesCalendrierPanelProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<RevealPhase>(reducedMotion ? "complete" : "idle");
  const [hasEntered, setHasEntered] = useState(reducedMotion);
  const [month, setMonth] = useState(() => new Date());
  const [cellSizePx, setCellSizePx] = useState(FALLBACK_CELL_SIZE_PX);
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const presetResult = useMemo(
    () => scoreAgencyPresets(qualificationValues, audience),
    [audience, qualificationValues],
  );

  const cards = useMemo(
    () => composeOpportunityCards(qualificationValues, presetResult.id, audience),
    [audience, qualificationValues, presetResult.id],
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

  const scrollWeeks = useMemo(
    () =>
      calendarScrollWeeksForMeetings(
        today,
        month,
        meetings.map((meeting) => meeting.date),
        VISIBLE_WEEKS,
      ),
    [meetings, month, today],
  );

  const scrollOffsetPx = scrollWeeks * (cellSizePx + GRID_GAP_PX);

  const calendarViewportHeight =
    CAPTION_HEIGHT_PX +
    WEEKDAY_ROW_HEIGHT_PX +
    VISIBLE_WEEKS * cellSizePx +
    (VISIBLE_WEEKS - 1) * GRID_GAP_PX;

  const phaseValue = useMemo(
    () => ({ phase, reducedMotion, hasEntered }),
    [hasEntered, phase, reducedMotion],
  );

  const dataValue = useMemo(
    () => ({ month, blockedKeys, meetingByKey }),
    [blockedKeys, meetingByKey, month],
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
      setHasEntered(true);
      return undefined;
    }

    setPhase("idle");
    setHasEntered(false);

    const { calendarMs, todayMs, grayedMs, scrollMs, bookingMs, completeMs } =
      getRevealSchedule(meetings.length);
    const timeouts: number[] = [];

    timeouts.push(
      window.setTimeout(() => {
        setPhase("calendar");
        setHasEntered(true);
      }, calendarMs),
    );
    timeouts.push(window.setTimeout(() => setPhase("today"), todayMs));
    timeouts.push(window.setTimeout(() => setPhase("grayed"), grayedMs));
    timeouts.push(window.setTimeout(() => setPhase("scrolled"), scrollMs));
    timeouts.push(window.setTimeout(() => setPhase("booking"), bookingMs));
    timeouts.push(window.setTimeout(() => setPhase("complete"), completeMs));
    timeouts.push(
      window.setTimeout(() => {
        setPhase((current) => (current === "idle" ? "calendar" : current));
        setHasEntered(true);
      }, IDLE_SAFETY_MS),
    );

    return () => {
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [meetings.length, reducedMotion]);

  const showScrolled = phaseAtLeast(phase, "scrolled") || reducedMotion;

  return (
    <CalendrierPhaseContext.Provider value={phaseValue}>
      <CalendrierDataContext.Provider value={dataValue}>
        <div className="flex flex-col gap-6">
          <SalesCalendrierBookingLegend
            audience={audience}
            cards={cards}
            meetings={meetings}
            today={today}
            phase={phase}
            clientSegment={clientSegment}
          />

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
                components={calendarDayButtonComponents}
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
      </CalendrierDataContext.Provider>
    </CalendrierPhaseContext.Provider>
  );
}
