export function hoursBefore(iso: string, hours: number): Date {
  return new Date(new Date(iso).getTime() - hours * 60 * 60 * 1000);
}

/** If the computed send time is already past, send on the next cron tick. */
export function clampToNow(date: Date): Date {
  const now = Date.now();
  return date.getTime() < now ? new Date(now) : date;
}

export function h48SendAt(scheduledAtIso: string): Date {
  return clampToNow(hoursBefore(scheduledAtIso, 48));
}

export function h24SendAt(scheduledAtIso: string): Date {
  return clampToNow(hoursBefore(scheduledAtIso, 24));
}

export function h20SendAt(scheduledAtIso: string): Date {
  return clampToNow(hoursBefore(scheduledAtIso, 20));
}

const PARIS_TZ = "Europe/Paris";

type ParisDateParts = {
  year: number;
  month: number;
  day: number;
  weekday: string;
};

function getParisDateParts(instant: Date): ParisDateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: PARIS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = formatter.formatToParts(instant);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    weekday: lookup.weekday ?? "",
  };
}

function isWeekendWeekday(weekday: string): boolean {
  return weekday === "Sat" || weekday === "Sun";
}

function parisDateKey(parts: ParisDateParts): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function addParisCalendarDays(dateKey: string, deltaDays: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + deltaDays, 12, 0, 0));
  return parisDateKey(getParisDateParts(utc));
}

/** 08:00 Europe/Paris on the given YYYY-MM-DD calendar day. */
export function parisAt8am(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 8, 0, 0));
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
  const totalOffsetMinutes = offsetHours * 60 + Math.sign(offsetHours) * offsetMinutes;
  return new Date(
    Date.UTC(year, month - 1, day, 8, 0, 0) - totalOffsetMinutes * 60 * 1000,
  );
}

/** Latest weekday 08:00 Paris that is still on or before `raw`. */
export function snapToPreviousWeekday8amParis(raw: Date): Date {
  let dateKey = parisDateKey(getParisDateParts(raw));
  let candidate = parisAt8am(dateKey);

  while (candidate.getTime() > raw.getTime()) {
    dateKey = addParisCalendarDays(dateKey, -1);
    candidate = parisAt8am(dateKey);
  }

  let weekday = getParisDateParts(candidate).weekday;
  while (isWeekendWeekday(weekday)) {
    dateKey = addParisCalendarDays(dateKey, -1);
    candidate = parisAt8am(dateKey);
    weekday = getParisDateParts(candidate).weekday;
  }

  return candidate;
}

export function roleSeq48SendAt(scheduledAtIso: string): Date {
  return clampToNow(snapToPreviousWeekday8amParis(hoursBefore(scheduledAtIso, 48)));
}

export function roleSeq24SendAt(scheduledAtIso: string): Date {
  return clampToNow(snapToPreviousWeekday8amParis(hoursBefore(scheduledAtIso, 24)));
}

const ROLE_RECOVERY_COMPRESSED_GAP_MS = 10 * 60 * 1000;

/** True when the meeting is less than 48h away (normal snap window missed). */
export function isRoleRecoveryCompressed(scheduledAtIso: string): boolean {
  return hoursBefore(scheduledAtIso, 48).getTime() <= Date.now();
}

export function planRoleRecoverySchedule(scheduledAtIso: string): {
  roleSeq48: Date;
  roleSeq24: Date;
  compressed: boolean;
} {
  if (isRoleRecoveryCompressed(scheduledAtIso)) {
    const roleSeq48 = clampToNow(new Date());
    const roleSeq24 = new Date(roleSeq48.getTime() + ROLE_RECOVERY_COMPRESSED_GAP_MS);
    return { roleSeq48, roleSeq24, compressed: true };
  }

  return {
    roleSeq48: roleSeq48SendAt(scheduledAtIso),
    roleSeq24: roleSeq24SendAt(scheduledAtIso),
    compressed: false,
  };
}
