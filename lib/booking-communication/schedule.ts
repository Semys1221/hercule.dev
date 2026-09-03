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
