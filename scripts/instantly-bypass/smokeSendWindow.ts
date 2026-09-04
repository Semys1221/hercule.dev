import assert from "node:assert/strict";

import {
  formatParisSlot,
  isWithinSendWindow,
  nextSendSlot,
} from "@/lib/instantly-bypass/send-window";

function parisUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
): Date {
  const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offsetFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
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
    Date.UTC(year, month - 1, day, hour, minute, 0) -
      totalOffsetMinutes * 60 * 1000,
  );
}

function parisHour(dt: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(dt);
  return Number(parts.find((part) => part.type === "hour")?.value ?? "0");
}

// Monday 7 Sep 2026
const monday6h = parisUtc(2026, 9, 7, 6);
const monday8h = parisUtc(2026, 9, 7, 8);
const monday10h = parisUtc(2026, 9, 8, 10);
const monday17h = parisUtc(2026, 9, 7, 17);
const friday18h = parisUtc(2026, 9, 11, 18);
const saturday10h = parisUtc(2026, 9, 12, 10);
const monday14Sep8h = parisUtc(2026, 9, 14, 8);

assert.equal(isWithinSendWindow(monday6h), false);
assert.equal(isWithinSendWindow(monday10h), true);
assert.equal(isWithinSendWindow(monday17h), false);
assert.equal(isWithinSendWindow(saturday10h), false);

assert.equal(parisHour(nextSendSlot(monday6h)), 8);
assert.equal(nextSendSlot(monday6h).toISOString(), monday8h.toISOString());

assert.equal(parisHour(nextSendSlot(friday18h)), 8);
assert.equal(nextSendSlot(friday18h).toISOString(), monday14Sep8h.toISOString());

assert.equal(parisHour(nextSendSlot(saturday10h)), 8);
assert.equal(nextSendSlot(saturday10h).toISOString(), monday14Sep8h.toISOString());

assert.match(formatParisSlot(monday8h), /08:00 \(Paris\)/);

console.log("send-window smoke tests passed");
