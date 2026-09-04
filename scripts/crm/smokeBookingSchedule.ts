import {
  clampToNow,
  parisAt8am,
  planRecoveryByMeetingWeekday,
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

// Tue 2027-09-07 10:00 Paris (08:00 UTC) → 48h raw Sun → Fri 08:00 Paris
assertEqual(
  roleSeq48SendAt("2027-09-07T08:00:00.000Z"),
  "2027-09-03T06:00:00.000Z",
  "roleSeq48 Tue meeting",
);

// Tue 2027-09-07 10:00 Paris → 24h raw Mon → Mon 08:00 Paris
assertEqual(
  roleSeq24SendAt("2027-09-07T08:00:00.000Z"),
  "2027-09-06T06:00:00.000Z",
  "roleSeq24 Tue meeting",
);

const sundayMorningParis = new Date("2027-09-05T08:00:00.000Z"); // Sun 10:00 Paris (CEST)
assertEqual(
  snapToPreviousWeekday8amParis(sundayMorningParis),
  parisAt8am("2027-09-03").toISOString(),
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
if (gapMs !== 5 * 60 * 1000) {
  throw new Error(`Compressed gap should be 5 minutes, got ${gapMs}ms`);
}

// Mon 2027-09-06 10:00 Paris → Sat 2027-09-04 08:00 + 08:05 Paris
const mondayMeeting = "2027-09-06T08:00:00.000Z";
const mondaySchedule = planRecoveryByMeetingWeekday(mondayMeeting);
if (mondaySchedule.variant !== "monday_meeting") {
  throw new Error(`Expected monday_meeting variant, got ${mondaySchedule.variant}`);
}
assertEqual(
  mondaySchedule.roleSeq48,
  "2027-09-04T06:00:00.000Z",
  "Monday meeting role_seq_48",
);
assertEqual(
  mondaySchedule.roleSeq24,
  "2027-09-04T06:05:00.000Z",
  "Monday meeting role_seq_24",
);

// Tue 2027-09-07 10:00 Paris → Sat 08:00 + Mon 08:00 Paris
const tuesdayMeeting = "2027-09-07T08:00:00.000Z";
const tuesdaySchedule = planRecoveryByMeetingWeekday(tuesdayMeeting);
if (tuesdaySchedule.variant !== "tuesday_meeting") {
  throw new Error(`Expected tuesday_meeting variant, got ${tuesdaySchedule.variant}`);
}
assertEqual(
  tuesdaySchedule.roleSeq48,
  "2027-09-04T06:00:00.000Z",
  "Tuesday meeting role_seq_48",
);
assertEqual(
  tuesdaySchedule.roleSeq24,
  "2027-09-06T06:00:00.000Z",
  "Tuesday meeting role_seq_24",
);

// Wed 2027-09-08 10:00 Paris → Mon 08:00 + Tue 08:00 Paris
const wednesdayMeeting = "2027-09-08T08:00:00.000Z";
const wednesdaySchedule = planRecoveryByMeetingWeekday(wednesdayMeeting);
if (wednesdaySchedule.variant !== "wednesday_meeting") {
  throw new Error(`Expected wednesday_meeting variant, got ${wednesdaySchedule.variant}`);
}
assertEqual(
  wednesdaySchedule.roleSeq48,
  "2027-09-06T06:00:00.000Z",
  "Wednesday meeting role_seq_48",
);
assertEqual(
  wednesdaySchedule.roleSeq24,
  "2027-09-07T06:00:00.000Z",
  "Wednesday meeting role_seq_24",
);

console.log("schedule smoke tests passed");
