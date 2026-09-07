"use client";

import { createContext } from "react";

import type { CalendarMeeting } from "./sales-calendrier-dates";
import type { RevealPhase } from "./sales-calendrier-reveal";

export type MeetingEntry = CalendarMeeting & { index: number };

export type CalendrierPhaseContextValue = {
  phase: RevealPhase;
  reducedMotion: boolean;
  hasEntered: boolean;
};

export type CalendrierDataContextValue = {
  month: Date;
  blockedKeys: Map<string, number>;
  meetingByKey: Map<string, MeetingEntry>;
};

export const CalendrierPhaseContext = createContext<CalendrierPhaseContextValue | null>(
  null,
);
export const CalendrierDataContext = createContext<CalendrierDataContextValue | null>(
  null,
);
