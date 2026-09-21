/** Wall-clock time in Europe/Paris on the calendar day of `base` (+ optional day offset). */
export function parisWallTime(base: Date, hour: number, dayOffset = 0): Date {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(base);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? "1");
  const date = new Date(
    Date.UTC(get("year"), get("month") - 1, get("day") + dayOffset, hour, 0, 0),
  );
  const shown = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
  );
  return new Date(date.getTime() + (hour - shown) * 60 * 60 * 1000);
}
