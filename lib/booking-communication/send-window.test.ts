/** Unit tests for booking send window rules. */

import assert from "node:assert/strict";

import {
  bypassesSendWindow,
  isWithinSendWindow,
  nextSendSlot,
} from "@/lib/booking-communication/send-window";
import { buildEntreprisePostBookingUrl } from "@/lib/booking-communication/templates";

function parisInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
): Date {
  const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    timeZoneName: "shortOffset",
  });
  const offsetPart = formatter
    .formatToParts(new Date(`${key}Z`))
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

function main() {
  assert.equal(bypassesSendWindow("immediate"), true);
  assert.equal(bypassesSendWindow("h48_confirm"), false);
  assert.equal(bypassesSendWindow("h24_relance"), false);
  assert.equal(bypassesSendWindow("h20_cancel"), false);

  const tuesday10h = parisInstant(2026, 9, 8, 10);
  const monday6h = parisInstant(2026, 9, 7, 6);
  const saturday10h = parisInstant(2026, 9, 12, 10);

  assert.equal(isWithinSendWindow(tuesday10h), true);
  assert.equal(isWithinSendWindow(monday6h), false);
  assert.equal(isWithinSendWindow(saturday10h), false);

  const nextFromNight = nextSendSlot(monday6h);
  assert.equal(isWithinSendWindow(nextFromNight), true);
  assert.ok(nextFromNight.getTime() > monday6h.getTime());

  const postBookingUrl = buildEntreprisePostBookingUrl("abc-slug", "test@example.com");
  assert.match(postBookingUrl, /post-booking-entreprise\.html\/abc-slug/);
  assert.match(postBookingUrl, /email=test%40example\.com/);

  console.log("booking send-window tests passed");
}

main();
