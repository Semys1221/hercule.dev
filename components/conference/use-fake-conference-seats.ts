"use client";

import { useEffect, useState } from "react";

import { CONFERENCE_CARDS } from "@/lib/commercial/conference-pricing";
import { fakeConferenceSeatsTaken } from "@/lib/conference/sale-window";

export function useFakeConferenceSeats(startedAt: string | null) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!startedAt) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return {
    decTaken: fakeConferenceSeatsTaken(CONFERENCE_CARDS.dec, startedAt, now),
    courtageTaken: fakeConferenceSeatsTaken(
      CONFERENCE_CARDS.courtage,
      startedAt,
      now,
    ),
  };
}
