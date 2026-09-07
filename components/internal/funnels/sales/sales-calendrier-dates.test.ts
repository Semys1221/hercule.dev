/** Unit tests for calendrier meeting placement. */

import assert from "node:assert/strict";

import {
  blockedDaysFromToday,
  bookMeetingsFromCards,
  calendarGridRevealIndex,
  calendarScrollWeeksBeforeToday,
  dateKey,
  BLOCKED_DAY_COUNT,
  isWeekend,
  nextWeekday,
} from "./sales-calendrier-dates";

const monday = new Date(2026, 8, 7);

const blocked = blockedDaysFromToday(monday, BLOCKED_DAY_COUNT);
assert.equal(blocked.length, 8);
assert.deepEqual(
  blocked.map(dateKey),
  [
    "2026-09-08",
    "2026-09-09",
    "2026-09-10",
    "2026-09-11",
    "2026-09-12",
    "2026-09-13",
    "2026-09-14",
    "2026-09-15",
  ],
);

assert.equal(calendarGridRevealIndex(monday, new Date(2026, 8, 1)), 7);
assert.equal(calendarGridRevealIndex(new Date(2026, 8, 1), new Date(2026, 8, 1)), 1);

assert.equal(dateKey(nextWeekday(new Date(2026, 8, 12))), "2026-09-14");
assert.equal(dateKey(nextWeekday(new Date(2026, 8, 14))), "2026-09-14");

const meetings = bookMeetingsFromCards(
  [
    { id: "a", secteur: "SEO", minDaysOffset: 9, maxDaysOffset: 15 },
    { id: "b", secteur: "Ads", minDaysOffset: 9, maxDaysOffset: 15 },
    { id: "c", secteur: "Web", minDaysOffset: 18, maxDaysOffset: 28 },
  ],
  monday,
);

assert.equal(meetings.length, 3);
assert.ok(meetings.every((meeting) => !isWeekend(meeting.date)));
assert.equal(new Set(meetings.map((meeting) => dateKey(meeting.date))).size, 3);
assert.equal(dateKey(meetings[0].date), "2026-09-21");
assert.equal(dateKey(meetings[1].date), "2026-09-22");
assert.equal(meetings[0].secteur, "SEO");

assert.equal(calendarScrollWeeksBeforeToday(monday, new Date(2026, 8, 1)), 1);
assert.equal(calendarScrollWeeksBeforeToday(new Date(2026, 8, 1), new Date(2026, 8, 1)), 0);

console.log("sales-calendrier-dates.test.ts: ok");
