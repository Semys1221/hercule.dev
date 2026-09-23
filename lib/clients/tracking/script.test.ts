import assert from "node:assert/strict";

import type { ClientAppointmentPublic } from "@/lib/clients/appointments/types";

import {
  buildTrackingScript,
  formatTrackingTime,
  TRACKING_FIRST_RDV_DAYS,
  TRACKING_STATIONS,
  TRACKING_VOLUME_WINDOW_DAYS,
  trackingDayOffset,
  type TrackingScriptInput,
} from "./script";

const TZ = "Europe/Paris";

function parisInstant(ymd: string, time: string): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = zoneOffset(new Date(utcGuess));
  let utc = utcGuess - offset;
  const corrected = zoneOffset(new Date(utc));
  if (corrected !== offset) utc = utcGuess - corrected;
  return new Date(utc);
}

function zoneOffset(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  const hour = read("hour") === 24 ? 0 : read("hour");
  const asUtc = Date.UTC(
    read("year"),
    read("month") - 1,
    read("day"),
    hour,
    read("minute"),
    read("second"),
  );
  return asUtc - date.getTime();
}

function appointment(partial: Partial<ClientAppointmentPublic>): ClientAppointmentPublic {
  return {
    id: "appt-1",
    inviteeName: null,
    inviteeEmail: "prospect@example.com",
    scheduledAt: null,
    status: "scheduled",
    questions: {},
    joinUrl: null,
    canAct: true,
    ...partial,
  };
}

function input(partial: Partial<TrackingScriptInput> = {}): TrackingScriptInput {
  return {
    succeededAt: parisInstant("2026-09-08", "11:24").toISOString(),
    retraction: {
      activationAt: parisInstant("2026-09-12", "00:01").toISOString(),
      status: "expired",
      endsAt: parisInstant("2026-09-12", "00:01").toISOString(),
    },
    clientType: "dec",
    offerType: "conference_dec_monthly",
    rdvTotal: 10,
    appointments: [],
    slug: "QxzohL",
    now: parisInstant("2026-10-20", "12:00"),
    calendarConnected: true,
    ...partial,
  };
}

function ymdInParis(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

assert.equal(TRACKING_STATIONS.length, 6);
assert.equal(TRACKING_STATIONS[4]?.id, "solvabilite");
assert.equal(TRACKING_STATIONS[5]?.id, "agenda");

const pending = buildTrackingScript(
  input({
    now: parisInstant("2026-09-10", "12:00"),
    retraction: {
      activationAt: parisInstant("2026-09-12", "00:01").toISOString(),
      status: "pending",
      endsAt: parisInstant("2026-09-12", "00:01").toISOString(),
    },
  }),
);

assert.equal(pending.stations[0]?.status, "active");
assert.ok(pending.scans.every((scan) => scan.station === "commande"));
assert.equal(
  pending.scans.some((scan) => scan.situation.includes("Calendrier")),
  false,
);
assert.match(pending.heroTitle, /rétractation/);
assert.equal(pending.volumeEndAt, null);

const earlyNow = parisInstant("2026-09-12", "10:00");
const early = buildTrackingScript(input({ now: earlyNow }));
assert.ok(early.scans.every((scan) => scan.at.getTime() <= earlyNow.getTime()));
assert.equal(
  early.scans.some((scan) => scan.id === "delivery"),
  false,
);

const late = buildTrackingScript(input());
const again = buildTrackingScript(input());
const calendlyPending = buildTrackingScript(
  input({ calendarConnected: false, now: parisInstant("2026-09-14", "10:00") }),
);
assert.equal(
  calendlyPending.scans.some((scan) => scan.situation.includes("Agendas Calendly liés")),
  false,
);
assert.ok(
  calendlyPending.scans.some((scan) =>
    scan.situation.includes("Liaison agenda Calendly en cours"),
  ),
);
assert.match(calendlyPending.heroDetail, /liaison de votre agenda Calendly/);
assert.ok(late.deliveryAt);
assert.equal(late.deliveryAt?.toISOString(), again.deliveryAt?.toISOString());
assert.equal(trackingDayOffset("QxzohL"), TRACKING_FIRST_RDV_DAYS);
assert.equal(trackingDayOffset("any-slug"), 25);

const activationYmd = "2026-09-12";
const deliveryYmd = ymdInParis(late.deliveryAt!);
const daySpan = Math.round(
  (Date.parse(`${deliveryYmd}T00:00:00Z`) - Date.parse(`${activationYmd}T00:00:00Z`)) /
    86_400_000,
);
assert.equal(daySpan, TRACKING_FIRST_RDV_DAYS);

const install = late.scans.find((scan) => scan.id === "install-0");
assert.ok(install);
assert.equal(formatTrackingTime(install.at), "09:14");
for (const scan of late.scans) {
  if (scan.station === "commande") continue;
  const [hour, minute] = formatTrackingTime(scan.at).split(":").map(Number);
  const minutes = hour * 60 + minute;
  assert.ok(minutes >= 8 * 60 + 40 && minutes <= 18 * 60 + 10, scan.id);
}

assert.equal(
  late.scans.some((scan) =>
    scan.situation.includes(
      "restaurants de plus de 3 salariés rencontrant des problématiques administratives importantes",
    ),
  ),
  true,
);

const cif = buildTrackingScript(input({ clientType: "cif", now: parisInstant("2026-10-20", "12:00") }));
assert.equal(
  cif.scans.some((scan) => scan.situation.includes("professionnels de santé")),
  true,
);
assert.equal(
  cif.scans.some((scan) => scan.situation.includes("Pappers")),
  false,
);
assert.equal(
  cif.scans.some((scan) =>
    scan.situation.includes("Signaux sectoriels appliqués — profils patrimoniaux"),
  ),
  true,
);

const pappersScans = late.scans.filter((scan) =>
  scan.situation.startsWith("Signaux Pappers appliqués —"),
);
assert.ok(pappersScans.length > 0, "DEC journal should include Pappers signals");

const signalA = late.scans.find((scan) => scan.id === "qual-profil-1-0");
const signalB = late.scans.find((scan) => scan.id === "qual-profil-3-0");
assert.ok(signalA?.situation.startsWith("Signaux Pappers appliqués —"));
assert.ok(signalB?.situation.startsWith("Signaux Pappers appliqués —"));
assert.notEqual(signalA?.situation, signalB?.situation);

const stableA = buildTrackingScript(input());
const stableB = buildTrackingScript(input());
const stableSignalsA = stableA.scans
  .filter((scan) => scan.situation.startsWith("Signaux Pappers appliqués —"))
  .map((scan) => scan.situation);
const stableSignalsB = stableB.scans
  .filter((scan) => scan.situation.startsWith("Signaux Pappers appliqués —"))
  .map((scan) => scan.situation);
assert.deepEqual(stableSignalsA, stableSignalsB);

const pierreActivation = parisInstant("2026-09-17", "00:01");
const pierreSept22 = buildTrackingScript(
  input({
    succeededAt: parisInstant("2026-09-16", "13:17").toISOString(),
    retraction: {
      activationAt: pierreActivation.toISOString(),
      status: "expired",
      endsAt: pierreActivation.toISOString(),
    },
    now: parisInstant("2026-09-22", "12:00"),
  }),
);
assert.equal(ymdInParis(pierreSept22.deliveryAt!), "2026-10-12");
assert.equal(ymdInParis(pierreSept22.volumeEndAt!), "2026-11-11");
const pierreActive = pierreSept22.stations.find((station) => station.status === "active");
assert.ok(pierreActive);
assert.equal(
  pierreActive?.id === "qualification" || pierreActive?.id === "volume",
  true,
  `expected qual or volume on Sept 22, got ${pierreActive?.id}`,
);

const phoneScans = late.scans.filter((scan) => scan.id.startsWith("qual-phone-"));
assert.ok(phoneScans.length > 0);
assert.ok(phoneScans.every((scan) => scan.station === "solvabilite"));
assert.ok(phoneScans.every((scan) => scan.stationLabel === "Solvabilité"));

assert.ok(late.volumeEndAt);
assert.ok(
  late.volumeEndAt!.getTime() > late.deliveryAt!.getTime(),
  "volume end must be after first rdv",
);
const volumeSpan = Math.round(
  (Date.parse(`${ymdInParis(late.volumeEndAt!)}T00:00:00Z`) -
    Date.parse(`${deliveryYmd}T00:00:00Z`)) /
    86_400_000,
);
assert.equal(volumeSpan, TRACKING_VOLUME_WINDOW_DAYS);

const slot = parisInstant(deliveryYmd, "14:00");
const withAppointment = buildTrackingScript(
  input({
    now: parisInstant("2026-10-20", "12:00"),
    appointments: [
      appointment({
        inviteeName: "Camille Bernard",
        scheduledAt: slot.toISOString(),
      }),
    ],
  }),
);
const delivery = withAppointment.scans.find((scan) => scan.id === "delivery");
assert.ok(delivery);
assert.match(delivery.situation, /Camille Bernard/);
assert.match(delivery.situation, /14:00/);
assert.equal(delivery.situation.includes("Premier rendez-vous"), false);
assert.equal(withAppointment.delivered, true);
assert.match(withAppointment.heroTitle, /attribué/);

const withoutAppointment = buildTrackingScript(input());
const cinemaDelivery = withoutAppointment.scans.find((scan) => scan.id === "delivery");
assert.match(
  cinemaDelivery?.situation ?? "",
  /Premier rendez-vous — profils ayant manifesté leur intérêt/,
);

console.log("tracking script.test.ts OK");
