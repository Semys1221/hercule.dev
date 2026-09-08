/** Unit tests for booking reminder status helpers. */

import assert from "node:assert/strict";

import type { BookingEmailJobSummary } from "@/lib/admin/bookings/email-jobs";
import {
  buildReminderLines,
  reminderMarkerTone,
} from "@/lib/admin/bookings/reminder-status";

function job(
  overrides: Partial<BookingEmailJobSummary> & Pick<BookingEmailJobSummary, "email_type">,
): BookingEmailJobSummary {
  return {
    id: "job-1",
    lead_id: "lead-1",
    status: "pending",
    scheduled_for: "2026-09-10T08:00:00.000Z",
    sent_at: null,
    error_message: null,
    triggered_by: "calendly",
    ...overrides,
  };
}

function main() {
  const lines = buildReminderLines({
    scheduledAt: "2026-09-12T08:00:00.000Z",
    category: "agence",
    jobs: [
      job({
        email_type: "immediate",
        status: "sent",
        sent_at: "2026-09-05T09:00:00.000Z",
      }),
      job({
        email_type: "h48_confirm",
        status: "pending",
        scheduled_for: "2026-09-10T08:00:00.000Z",
      }),
    ],
    now: Date.parse("2026-09-11T08:00:00.000Z"),
  });

  assert.equal(lines.find((line) => line.emailType === "immediate")?.status, "sent");
  assert.equal(lines.find((line) => line.emailType === "h48_confirm")?.status, "live");
  assert.equal(lines.find((line) => line.emailType === "h24_relance")?.status, "absent");
  assert.equal(reminderMarkerTone(lines), "live");

  const recovery = buildReminderLines({
    scheduledAt: "2026-09-09T08:00:00.000Z",
    category: "agence",
    jobs: [],
  });
  assert.equal(recovery.length, 2);
  assert.equal(reminderMarkerTone(recovery), "missing");

  console.log("reminder-status tests passed");
}

main();
