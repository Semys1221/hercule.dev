import {
  clampToNow,
  parisAt8am,
  planRoleRecoverySchedule,
  roleSeq24SendAt,
  roleSeq48SendAt,
  snapToPreviousWeekday8amParis,
} from "@/lib/booking-communication/schedule";

function assertEqual(actual: Date, expectedIso: string, label: string) {
  const actualIso = actual.toISOString();
  if (actualIso !== expectedIso) {
    throw new Error(`${label}: expected ${expectedIso}, got ${actualIso}`);
  }
}

// Tue 2026-09-08 10:00 Paris (08:00 UTC) → 48h raw Sun 10:00 Paris → Fri 08:00 Paris
assertEqual(
  roleSeq48SendAt("2026-09-08T08:00:00.000Z"),
  "2026-09-04T06:00:00.000Z",
  "roleSeq48 Tue meeting",
);

// Tue 2026-09-08 10:00 Paris → 24h raw Mon 10:00 Paris → Mon 08:00 Paris
assertEqual(
  roleSeq24SendAt("2026-09-08T08:00:00.000Z"),
  "2026-09-07T06:00:00.000Z",
  "roleSeq24 Tue meeting",
);

const sundayMorningParis = new Date("2026-09-06T08:00:00.000Z"); // Sun 10:00 Paris (CEST)
assertEqual(
  snapToPreviousWeekday8amParis(sundayMorningParis),
  parisAt8am("2026-09-04").toISOString(),
  "snap Sunday raw to Friday 8am",
);

const past = new Date("2020-01-01T12:00:00.000Z");
const clamped = clampToNow(past);
if (clamped.getTime() < Date.now() - 5_000) {
  throw new Error("clampToNow should return a recent timestamp for past dates");
}

const meetingIn24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const compressed = planRoleRecoverySchedule(meetingIn24h);
if (!compressed.compressed) {
  throw new Error("Meeting in 24h should use compressed schedule");
}
const gapMs = compressed.roleSeq24.getTime() - compressed.roleSeq48.getTime();
if (gapMs !== 10 * 60 * 1000) {
  throw new Error(`Compressed gap should be 10 minutes, got ${gapMs}ms`);
}

console.log("schedule smoke tests passed");
