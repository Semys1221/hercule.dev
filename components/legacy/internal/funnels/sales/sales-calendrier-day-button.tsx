"use client";

import { useContext, type ComponentProps } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { getSecteurConfig } from "@/lib/agence/secteur-config";
import { CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import {
  CalendrierDataContext,
  CalendrierPhaseContext,
} from "./sales-calendrier-context";
import { calendarGridRevealIndex, dateKey } from "./sales-calendrier-dates";
import { phaseAtLeast, REVEAL } from "./sales-calendrier-reveal";

const DOMINO_VISIBLE = { opacity: 1, scale: 1, y: 0 };
const DOMINO_HIDDEN = { opacity: 0, scale: 0.88, y: -6 };

export function AnimatedDayButton({
  className,
  day,
  modifiers,
  ...props
}: ComponentProps<typeof CalendarDayButton>) {
  const phaseCtx = useContext(CalendrierPhaseContext);
  const dataCtx = useContext(CalendrierDataContext);

  const key = dateKey(day.date);
  const blockedIndex = dataCtx?.blockedKeys.get(key);
  const meeting = dataCtx?.meetingByKey.get(key);
  const reducedMotion = phaseCtx?.reducedMotion ?? false;
  const phase = phaseCtx?.phase ?? "idle";
  const month = dataCtx?.month ?? day.date;
  const hasEntered = phaseCtx?.hasEntered ?? false;

  const revealIndex = calendarGridRevealIndex(day.date, month);
  const showDomino = Boolean(
    phaseCtx && (phaseAtLeast(phase, "calendar") || reducedMotion),
  );
  const isVisible = showDomino || hasEntered;
  const showToday = Boolean(
    modifiers.today && phaseCtx && phaseAtLeast(phase, "today"),
  );
  const showBlocked =
    blockedIndex !== undefined && phaseCtx && phaseAtLeast(phase, "grayed");
  const showMeeting = Boolean(meeting && phaseCtx && phaseAtLeast(phase, "booking"));

  const secteurConfig = meeting
    ? getSecteurConfig(meeting.secteur, "internal")
    : null;
  const MeetingIcon = secteurConfig?.icon;

  return (
    <motion.div
      className="relative size-full"
      initial={reducedMotion || hasEntered ? false : DOMINO_HIDDEN}
      animate={isVisible ? DOMINO_VISIBLE : DOMINO_HIDDEN}
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

export const calendarDayButtonComponents = { DayButton: AnimatedDayButton };
