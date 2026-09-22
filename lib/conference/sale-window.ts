import type { ConferenceCard } from "@/lib/commercial/conference-pricing";
import { CONFERENCE_CARDS } from "@/lib/commercial/conference-pricing";

export const CONFERENCE_SALE_WINDOW_ID =
  "00000000-0000-4000-8000-000000000001";

export const FAKE_SEAT_CAPACITY = 4;

export const FAKE_DEC_TICKS_MS = [30_000, 115_000, 245_000] as const;
export const FAKE_COURTAGE_TICKS_MS = [48_000, 160_000, 256_000] as const;

export const CONFERENCE_INSCRIPTION_MESSAGES = {
  waiting: "Merci de patienter, le présentateur lance le décompte pour tous.",
  closed: "Les inscriptions sont closes.",
  open: "Les inscriptions sont disponibles.",
} as const;

export type ConferenceRegistrationPhase = "waiting" | "open" | "closed";

export type ConferenceSaleWindowStatus = "idle" | "open" | "closed";

export type ConferenceSaleWindowRow = {
  id: string;
  status: ConferenceSaleWindowStatus;
  started_at: string | null;
  ends_at: string | null;
  duration_seconds: number;
};

export type ConferenceSaleWindowPublic = {
  status: ConferenceSaleWindowStatus;
  phase: ConferenceRegistrationPhase;
  checkoutOpen: boolean;
  inactiveMessage: string;
  startedAt: string | null;
  decTaken: number;
  courtageTaken: number;
};

export function phaseForStatus(
  status: ConferenceSaleWindowStatus,
): ConferenceRegistrationPhase {
  if (status === "open") return "open";
  if (status === "closed") return "closed";
  return "waiting";
}

export function statusForPhase(
  phase: ConferenceRegistrationPhase,
): ConferenceSaleWindowStatus {
  if (phase === "open") return "open";
  if (phase === "closed") return "closed";
  return "idle";
}

export function isConferenceCheckoutOpen(
  row: Pick<ConferenceSaleWindowRow, "status">,
): boolean {
  return row.status === "open";
}

export function fakeConferenceSeatsTaken(
  card: ConferenceCard,
  startedAt: Date | string | null,
  now: Date = new Date(),
): number {
  if (!startedAt) return 0;
  const startMs =
    typeof startedAt === "string"
      ? new Date(startedAt).getTime()
      : startedAt.getTime();
  if (!Number.isFinite(startMs)) return 0;
  const elapsed = now.getTime() - startMs;
  const ticks =
    card === CONFERENCE_CARDS.dec ? FAKE_DEC_TICKS_MS : FAKE_COURTAGE_TICKS_MS;
  return ticks.filter((tick) => elapsed >= tick).length;
}

export function toPublicSaleWindow(
  row: ConferenceSaleWindowRow,
  now: Date = new Date(),
): ConferenceSaleWindowPublic {
  const phase = phaseForStatus(row.status);
  const checkoutOpen = isConferenceCheckoutOpen(row);
  const startedAt = checkoutOpen ? row.started_at : null;

  return {
    status: row.status,
    phase,
    checkoutOpen,
    inactiveMessage: CONFERENCE_INSCRIPTION_MESSAGES[phase],
    startedAt,
    decTaken: fakeConferenceSeatsTaken(CONFERENCE_CARDS.dec, startedAt, now),
    courtageTaken: fakeConferenceSeatsTaken(
      CONFERENCE_CARDS.courtage,
      startedAt,
      now,
    ),
  };
}
