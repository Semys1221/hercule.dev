const PARIS_TZ = "Europe/Paris";

export const SEND_WINDOW_START_HOUR = 8;
export const SEND_WINDOW_END_HOUR = 17;

const WEEKDAY_NAMES_FR = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
] as const;

const MONTH_NAMES_FR = [
  "jan.",
  "fév.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
] as const;

type ParisParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
};

function getParisParts(instant: Date): ParisParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: PARIS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = formatter.formatToParts(instant);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekdayMap: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
    weekday: weekdayMap[lookup.weekday ?? "Mon"] ?? 0,
  };
}

function parisAtHour(dateKey: string, hour: number): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
  const offsetFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: PARIS_TZ,
    timeZoneName: "shortOffset",
  });
  const offsetPart = offsetFormatter
    .formatToParts(utcGuess)
    .find((part) => part.type === "timeZoneName")?.value;
  const match = offsetPart?.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
  const offsetHours = match ? Number(match[1]) : 1;
  const offsetMinutes = match?.[2] ? Number(match[2]) : 0;
  const totalOffsetMinutes =
    offsetHours * 60 + Math.sign(offsetHours) * offsetMinutes;
  return new Date(
    Date.UTC(year, month - 1, day, hour, 0, 0) - totalOffsetMinutes * 60 * 1000,
  );
}

function parisDateKey(parts: ParisParts): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function addParisCalendarDays(dateKey: string, deltaDays: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + deltaDays, 12, 0, 0));
  return parisDateKey(getParisParts(utc));
}

export function isWeekdayParis(dt: Date = new Date()): boolean {
  return getParisParts(dt).weekday < 5;
}

export function isWithinSendWindow(dt: Date = new Date()): boolean {
  const parts = getParisParts(dt);
  if (parts.weekday >= 5) return false;
  const minutes = parts.hour * 60 + parts.minute;
  const start = SEND_WINDOW_START_HOUR * 60;
  const end = SEND_WINDOW_END_HOUR * 60;
  return minutes >= start && minutes < end;
}

export function nextSendSlot(dt: Date = new Date()): Date {
  const parts = getParisParts(dt);
  let dateKey = parisDateKey(parts);
  const minutes = parts.hour * 60 + parts.minute;
  const start = SEND_WINDOW_START_HOUR * 60;
  const end = SEND_WINDOW_END_HOUR * 60;

  if (parts.weekday < 5 && minutes < start) {
    return parisAtHour(dateKey, SEND_WINDOW_START_HOUR);
  }

  if (isWithinSendWindow(dt)) {
    return dt;
  }

  if (parts.weekday < 5 && minutes >= end) {
    dateKey = addParisCalendarDays(dateKey, 1);
  } else if (parts.weekday >= 5) {
    dateKey = addParisCalendarDays(dateKey, parts.weekday === 5 ? 2 : 1);
  }

  let candidate = getParisParts(parisAtHour(dateKey, SEND_WINDOW_START_HOUR));
  while (candidate.weekday >= 5) {
    dateKey = addParisCalendarDays(dateKey, 1);
    candidate = getParisParts(parisAtHour(dateKey, SEND_WINDOW_START_HOUR));
  }

  return parisAtHour(dateKey, SEND_WINDOW_START_HOUR);
}

export function formatParisSlot(dtUtc: Date): string {
  const parts = getParisParts(dtUtc);
  const weekday = WEEKDAY_NAMES_FR[parts.weekday] ?? "";
  const month = MONTH_NAMES_FR[parts.month - 1] ?? "";
  return `${weekday} ${parts.day} ${month} ${parts.year} à ${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")} (Paris)`;
}
