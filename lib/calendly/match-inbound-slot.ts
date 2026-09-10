import { formatFrenchSlotLabel } from "@/lib/calendly/availability";

const PARIS_TIMEZONE = "Europe/Paris";

const WEEKDAYS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
] as const;

export type SlotCandidate = {
  startTime: string;
  label: string;
};

export type MatchInboundSlotResult =
  | { kind: "matched"; startTime: string; label: string; score: number }
  | { kind: "ambiguous"; suggestions: SlotCandidate[] }
  | { kind: "none" };

const MATCH_THRESHOLD = 4;
const MATCH_GAP = 2;

export function stripQuotedThread(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }
  const lines = trimmed.split("\n");
  const kept: string[] = [];
  for (const line of lines) {
    if (/^>{1,2}\s/.test(line)) {
      break;
    }
    if (/^(de\s*:|from\s*:|-----message)/i.test(line.trim())) {
      break;
    }
    if (/^le\s+(lun|mar|mer|jeu|ven|sam|dim)\./i.test(line.trim())) {
      break;
    }
    kept.push(line);
  }
  return kept.join("\n").trim();
}

function parisParts(date: Date): {
  weekday: string;
  day: number;
  month: number;
  hour: number;
  minute: number;
} {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  const weekday =
    parts.find((part) => part.type === "weekday")?.value?.toLowerCase() ?? "";
  return {
    weekday,
    day: read("day"),
    month: read("month"),
    hour: read("hour"),
    minute: read("minute"),
  };
}

function isTomorrowInParis(slot: Date, now: Date): boolean {
  const slotDay = parisParts(slot);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowDay = parisParts(tomorrow);
  return (
    slotDay.day === tomorrowDay.day &&
    slotDay.month === tomorrowDay.month
  );
}

function scoreSlotAgainstInbound(
  slot: Date,
  probe: string,
  now: Date,
): number {
  let score = 0;
  const parts = parisParts(slot);
  const label = formatFrenchSlotLabel(slot).toLowerCase();

  if (parts.weekday && probe.includes(parts.weekday)) {
    score += 3;
  }

  const dayPattern = new RegExp(`\\b${parts.day}\\b`);
  if (dayPattern.test(probe)) {
    score += 2;
  }

  const hourPattern = new RegExp(`\\b${parts.hour}\\s*h`);
  if (hourPattern.test(probe)) {
    score += 3;
  } else if (probe.includes(`${parts.hour}h`)) {
    score += 3;
  }

  if (parts.minute > 0) {
    const minuteToken = parts.minute < 10 ? `0${parts.minute}` : String(parts.minute);
    if (probe.includes(`${parts.hour}h${minuteToken}`) || probe.includes(`${parts.hour}h${parts.minute}`)) {
      score += 2;
    }
  }

  if (probe.includes("demain") && isTomorrowInParis(slot, now)) {
    score += 2;
  }

  if (probe.includes("matin") && parts.hour < 12) {
    score += 1;
  }
  if (
    (probe.includes("après-midi") || probe.includes("apres-midi") || probe.includes("aprem")) &&
    parts.hour >= 12 &&
    parts.hour < 18
  ) {
    score += 1;
  }

  if (label && probe.includes(label)) {
    score += 6;
  }

  for (const weekday of WEEKDAYS) {
    if (probe.includes(weekday) && !probe.includes(parts.weekday)) {
      score -= 1;
    }
  }

  return score;
}

export function matchInboundSlot(
  inboundText: string,
  slots: SlotCandidate[],
  now: Date = new Date(),
): MatchInboundSlotResult {
  const probe = stripQuotedThread(inboundText).toLowerCase();
  if (!probe || slots.length === 0) {
    return { kind: "none" };
  }

  const hasSchedulingSignal =
    WEEKDAYS.some((day) => probe.includes(day)) ||
    probe.includes("demain") ||
    /\d{1,2}\s*h/.test(probe) ||
    probe.includes("matin") ||
    probe.includes("après-midi") ||
    probe.includes("apres-midi") ||
    probe.includes("disponib");

  if (!hasSchedulingSignal) {
    return { kind: "none" };
  }

  const ranked = slots
    .map((slot) => {
      const date = new Date(slot.startTime);
      const score = scoreSlotAgainstInbound(date, probe, now);
      return { ...slot, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  if (ranked.length === 0) {
    return { kind: "none" };
  }

  const best = ranked[0];
  const second = ranked[1];
  if (
    best.score >= MATCH_THRESHOLD &&
    (!second || best.score - second.score >= MATCH_GAP)
  ) {
    return {
      kind: "matched",
      startTime: best.startTime,
      label: best.label,
      score: best.score,
    };
  }

  return {
    kind: "ambiguous",
    suggestions: ranked.slice(0, 2).map((entry) => ({
      startTime: entry.startTime,
      label: entry.label,
    })),
  };
}
