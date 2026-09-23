import {
  type ConferenceClientType,
} from "@/lib/commercial/conference-pricing";
import type { ClientAppointmentPublic } from "@/lib/clients/appointments/types";

import {
  formatPappersSignalJournalLine,
  PAPPERS_SIGNAL_PLACEHOLDER,
  pickPappersSignal,
  SECTOR_SIGNAL_JOURNAL_LINE,
} from "./pappers-signals";

const TZ = "Europe/Paris";

const BUSINESS_OPEN = 8 * 60 + 40;
const BUSINESS_CLOSE = 18 * 60 + 10;

/** Calendar days from activation to first appointment (canon email: 17 sept → 12 oct). */
export const TRACKING_FIRST_RDV_DAYS = 25;

/** Calendar days from first appointment to last planned RDV. */
export const TRACKING_VOLUME_WINDOW_DAYS = 30;

/** Phase boundaries (calendar days from activation). */
const PHASE_VOLUME_END = 2;
const PHASE_QUAL_PROFIL_END = 9;
const PHASE_QUAL_PHONE_END = 18;

export const TRACKING_STATIONS = [
  { id: "commande", label: "Commande", hint: "Hercule" },
  { id: "installation", label: "Installation", hint: "Calendrier" },
  { id: "volume", label: "Volume", hint: "Liste" },
  { id: "qualification", label: "Qualification", hint: "Filtre" },
  { id: "solvabilite", label: "Solvabilité", hint: "Intérêt" },
  { id: "agenda", label: "Agenda", hint: "Livraison" },
] as const;

export type TrackingStationId = (typeof TRACKING_STATIONS)[number]["id"];

export type TrackingScan = {
  id: string;
  at: Date;
  situation: string;
  station: TrackingStationId;
  stationLabel: string;
};

export type TrackingStationState = {
  id: TrackingStationId;
  label: string;
  hint: string;
  status: "done" | "active" | "pending";
};

export type TrackingScript = {
  scans: TrackingScan[];
  stations: TrackingStationState[];
  heroTitle: string;
  heroDetail: string;
  deliveryAt: Date | null;
  volumeEndAt: Date | null;
  delivered: boolean;
};

export type TrackingScriptInput = {
  succeededAt: string | null;
  retraction: {
    activationAt: string | null;
    status: string;
    endsAt: string | null;
  } | null;
  clientType: ConferenceClientType;
  offerType: string;
  rdvTotal: number;
  appointments: ClientAppointmentPublic[];
  slug: string;
  now: Date;
  calendarConnected: boolean;
};

const NICHE_LABEL: Record<ConferenceClientType, string> = {
  dec: "restaurants de plus de 3 salariés rencontrant des problématiques administratives importantes",
  cif: "professionnels de santé",
  ias: "professionnels de santé",
};

const INSTALL_DAY0: { time: string; situation: string }[] = [
  { time: "09:14", situation: "Agendas Calendly liés" },
  { time: "10:30", situation: "Premiers tests lancés" },
  { time: "11:42", situation: "Disponibilités relevées" },
  { time: "14:05", situation: "Création du volume — données brutes dans les bases Hercule" },
  { time: "16:08", situation: "Appel d'intégration effectué" },
  { time: "17:36", situation: "Critères secteur enregistrés" },
];

const VOLUME_LINES = [
  "Identification d'entrepreneurs uniquement",
  "Liste de professionnels ouverte",
  "Profils cibles identifiés dans les bases Hercule",
  "Lot de profils ajouté au terrain",
] as const;

const QUAL_PROFIL_LINES = [
  "Qualification des profils ouverte",
  "Tri selon taille d'entreprise et informations disponibles",
  PAPPERS_SIGNAL_PLACEHOLDER,
  "Profils écartés — les profils retenus restent",
] as const;

const QUAL_PHONE_LINES = [
  "Qualification téléphonique lancée",
  "Profils qualifiés par téléphone",
  "Matchmaking en cours",
  "Profils intéressés — prise de rendez-vous dans votre agenda",
] as const;

const AGENDA_PREP_LINES = [
  "Problématique présentée aux profils retenus",
  "Créneaux qualifiés mis à disposition",
  "Profils ayant manifesté leur intérêt en cours de réservation",
] as const;

const STATION_LABEL: Record<TrackingStationId, string> = {
  commande: "Commande",
  installation: "Installation",
  volume: "Volume",
  qualification: "Qualification",
  solvabilite: "Solvabilité",
  agenda: "Agenda",
};

const VOLUME_CLOCKS = ["08:51", "10:05", "11:20", "14:17", "15:40", "16:47"] as const;
const QUAL_CLOCKS = ["08:47", "09:06", "14:28", "15:12", "17:05"] as const;
const AGENDA_CLOCKS = ["09:12", "11:35", "15:08", "17:22"] as const;

/** @deprecated Fixed J+25 — kept for test compatibility. */
export function trackingDayOffset(_slug: string): number {
  return TRACKING_FIRST_RDV_DAYS;
}

export function formatTrackingDate(at: Date): string {
  const { day, month, year } = parisParts(at);
  return `${day}/${month}/${year}`;
}

export function formatTrackingTime(at: Date): string {
  const { hour, minute } = parisParts(at);
  return `${hour}:${minute}`;
}

export function formatTrackingLong(at: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(at);
}

export function buildTrackingScript(input: TrackingScriptInput): TrackingScript {
  const activation = parseInstant(input.retraction?.activationAt ?? input.succeededAt);
  const payment = parseInstant(input.succeededAt) ?? activation;
  const empty = emptyScript();

  if (!activation || !payment) {
    return empty;
  }

  const now = input.now;
  const frozen = isFrozen(input.retraction, now);
  const activationYmd = parisYmd(activation);
  const deliveryYmd = addYmdDays(activationYmd, TRACKING_FIRST_RDV_DAYS);
  const deliveryAt = parisDateAt(deliveryYmd, "09:06");
  const volumeEndYmd = addYmdDays(deliveryYmd, TRACKING_VOLUME_WINDOW_DAYS);
  const volumeEndAt = parisDateAt(volumeEndYmd, "09:20");
  const niche = NICHE_LABEL[input.clientType];
  const scans: TrackingScan[] = [];

  push(scans, {
    id: "payment",
    at: payment,
    station: "commande",
    situation: "Paiement confirmé",
  });
  push(scans, {
    id: "dossier",
    at: new Date(payment.getTime() + 2 * 60_000),
    station: "commande",
    situation: `Dossier ouvert — ${Math.max(input.rdvTotal, 0)} rendez-vous`,
  });

  if (input.retraction?.status === "pending" || input.retraction?.endsAt) {
    push(scans, {
      id: "retraction-open",
      at: new Date(payment.getTime() + 3 * 60 * 60_000),
      station: "commande",
      situation: "Délai de rétractation ouvert (4 jours)",
    });
  }

  if (!frozen && activation.getTime() > payment.getTime() + 60_000) {
    push(scans, {
      id: "retraction-close",
      at: activation,
      station: "commande",
      situation: "Délai de rétractation clos — service activé",
    });
  }

  if (!frozen) {
    appendOperations({
      scans,
      activation,
      activationYmd,
      deliveryYmd,
      deliveryAt,
      niche,
      rdvTotal: input.rdvTotal,
      slug: input.slug,
      clientType: input.clientType,
      calendarConnected: input.calendarConnected,
    });
    applyRealAppointment(scans, input.appointments, now);
  }

  const visible = scans
    .filter((scan) => scan.at.getTime() <= now.getTime())
    .sort((a, b) => b.at.getTime() - a.at.getTime() || a.id.localeCompare(b.id));

  const delivered = !frozen && visible.some((scan) => scan.id === "delivery");
  const activeId = delivered
    ? "agenda"
    : (visible[0]?.station ?? "commande");
  const stations = stationStates(activeId);
  const scheduled = scheduledAppointment(input.appointments);
  const heroWhen = scheduled?.scheduledAt
    ? parseInstant(scheduled.scheduledAt) ?? deliveryAt
    : deliveryAt;

  return {
    scans: visible,
    stations,
    deliveryAt,
    volumeEndAt: frozen ? null : volumeEndAt,
    delivered,
    ...heroCopy({
      frozen,
      delivered,
      activeId,
      deliveryAt,
      volumeEndAt,
      rdvTotal: input.rdvTotal,
      heroWhen,
      retraction: input.retraction,
      calendarConnected: input.calendarConnected,
    }),
  };
}

function emptyScript(): TrackingScript {
  return {
    scans: [],
    stations: stationStates("commande").map((station) =>
      station.id === "commande" ? station : { ...station, status: "pending" as const },
    ),
    heroTitle: "Suivi en préparation",
    heroDetail: "Le bordereau apparaîtra dès confirmation du dossier.",
    deliveryAt: null,
    volumeEndAt: null,
    delivered: false,
  };
}

function heroCopy(params: {
  frozen: boolean;
  delivered: boolean;
  activeId: TrackingStationId;
  deliveryAt: Date;
  volumeEndAt: Date;
  rdvTotal: number;
  heroWhen: Date;
  retraction: TrackingScriptInput["retraction"];
  calendarConnected: boolean;
}): { heroTitle: string; heroDetail: string } {
  if (params.frozen) {
    const ends = parseInstant(params.retraction?.endsAt ?? null);
    return {
      heroTitle: "Votre déploiement est en cours de rétractation",
      heroDetail: ends
        ? `Activation prévue le ${formatTrackingLong(ends)}`
        : "Le suivi opérationnel commencera à la fin du délai.",
    };
  }

  if (params.delivered) {
    return {
      heroTitle: "Votre rendez-vous est attribué",
      heroDetail: formatTrackingLong(params.heroWhen),
    };
  }

  const titles: Record<TrackingStationId, string> = {
    commande: "Votre déploiement est enregistré",
    installation: "Votre intégration est en cours",
    volume: "Création du volume en cours",
    qualification: "Qualification des profils en cours",
    solvabilite: "Vérification de solvabilité en cours",
    agenda: "Votre premier rendez-vous approche",
  };

  const phaseDetail: Record<TrackingStationId, string> = {
    commande: "Confirmation du dossier en cours.",
    installation: params.calendarConnected
      ? "Agendas Calendly liés et premiers tests lancés."
      : "Finalisation de la liaison de votre agenda Calendly.",
    volume: "Les algorithmes identifient des entrepreneurs dans nos bases.",
    qualification: "Tri des profils selon vos critères sectoriels.",
    solvabilite: "Appels de qualification et matchmaking en cours.",
    agenda: "Les profils intéressés réservent directement dans votre agenda.",
  };

  return {
    heroTitle: titles[params.activeId],
    heroDetail: phaseDetail[params.activeId],
  };
}

function installDay0Situation(
  template: string,
  calendarConnected: boolean,
  niche?: string,
): string {
  if (template === "Agendas Calendly liés" && !calendarConnected) {
    return "Liaison agenda Calendly en cours";
  }
  if (!calendarConnected) {
    if (template === "Premiers tests lancés") {
      return "Invitation Calendly — en attente de connexion";
    }
    if (template === "Disponibilités relevées") {
      return "Agenda en attente de liaison";
    }
  }
  if (template === "Critères secteur enregistrés" && niche) {
    return `${template} — ${niche}`;
  }
  return template;
}

function appendOperations(params: {
  scans: TrackingScan[];
  activation: Date;
  activationYmd: string;
  deliveryYmd: string;
  deliveryAt: Date;
  niche: string;
  rdvTotal: number;
  slug: string;
  clientType: ConferenceClientType;
  calendarConnected: boolean;
}) {
  const day0Ymd = nextWorkingYmd(params.activationYmd);

  INSTALL_DAY0.forEach((slot, index) => {
    const situation = installDay0Situation(
      slot.situation,
      params.calendarConnected,
      slot.situation === "Critères secteur enregistrés" ? params.niche : undefined,
    );
    pushAtClock(params.scans, params.activation, {
      id: `install-${index}`,
      ymd: day0Ymd,
      time: slot.time,
      station: index < 3 ? "installation" : "volume",
      situation,
    });
  });

  for (let day = 1; day <= PHASE_QUAL_PHONE_END; day += 1) {
    const ymd = addYmdDays(params.activationYmd, day);
    if (isWeekendYmd(ymd)) continue;

    if (day <= PHASE_VOLUME_END) {
      appendPhaseScans({
        scans: params.scans,
        activation: params.activation,
        ymd,
        dayIndex: day,
        station: "volume",
        lines: VOLUME_LINES,
        clocks: VOLUME_CLOCKS,
        idPrefix: "volume",
        niche: params.niche,
        slug: params.slug,
        clientType: params.clientType,
      });
    } else if (day <= PHASE_QUAL_PROFIL_END) {
      appendPhaseScans({
        scans: params.scans,
        activation: params.activation,
        ymd,
        dayIndex: day - PHASE_VOLUME_END,
        station: "qualification",
        lines: QUAL_PROFIL_LINES,
        clocks: QUAL_CLOCKS,
        idPrefix: "qual-profil",
        slug: params.slug,
        clientType: params.clientType,
      });
    } else if (day <= PHASE_QUAL_PHONE_END) {
      appendPhaseScans({
        scans: params.scans,
        activation: params.activation,
        ymd,
        dayIndex: day - PHASE_QUAL_PROFIL_END,
        station: "solvabilite",
        lines: QUAL_PHONE_LINES,
        clocks: QUAL_CLOCKS,
        idPrefix: "qual-phone",
        slug: params.slug,
        clientType: params.clientType,
      });
    } else {
      appendPhaseScans({
        scans: params.scans,
        activation: params.activation,
        ymd,
        dayIndex: day - PHASE_QUAL_PHONE_END,
        station: "agenda",
        lines: AGENDA_PREP_LINES,
        clocks: AGENDA_CLOCKS,
        idPrefix: "agenda-prep",
        slug: params.slug,
        clientType: params.clientType,
      });
    }
  }

  push(params.scans, {
    id: "delivery",
    at: params.deliveryAt,
    station: "agenda",
    situation:
      "Premier rendez-vous — profils ayant manifesté leur intérêt et réservé dans les 24 h précédentes",
  });

  const total = Math.max(params.rdvTotal, 0);
  for (let n = 2; n <= total; n += 1) {
    const offset =
      total <= 1
        ? 0
        : Math.round((TRACKING_VOLUME_WINDOW_DAYS * (n - 1)) / (total - 1));
    const ymd = addYmdDays(params.deliveryYmd, offset);
    push(params.scans, {
      id: `followup-${n}`,
      at: parisDateAt(ymd, "09:20"),
      station: "agenda",
      situation: `${n}e rendez-vous en préparation`,
    });
  }
}

function appendPhaseScans(params: {
  scans: TrackingScan[];
  activation: Date;
  ymd: string;
  dayIndex: number;
  station: TrackingStationId;
  lines: readonly string[];
  clocks: readonly string[];
  idPrefix: string;
  niche?: string;
  slug: string;
  clientType: ConferenceClientType;
}) {
  const clocks = clocksForDay(params.clocks, params.dayIndex);
  clocks.forEach((time, slotIndex) => {
    const line = params.lines[(params.dayIndex * 2 + slotIndex) % params.lines.length];
    let situation = line;
    if (line === PAPPERS_SIGNAL_PLACEHOLDER) {
      const slotKey = `${params.idPrefix}-${params.dayIndex}-${slotIndex}`;
      situation =
        params.clientType === "dec"
          ? formatPappersSignalJournalLine(pickPappersSignal(params.slug, slotKey))
          : SECTOR_SIGNAL_JOURNAL_LINE;
    }
    if (params.niche && line === "Liste de professionnels ouverte") {
      situation = `${line} — ${params.niche}`;
    }
    if (params.niche && line === "Profils cibles identifiés dans les bases Hercule") {
      situation = `${line} — ${params.niche}`;
    }
    pushAtClock(params.scans, params.activation, {
      id: `${params.idPrefix}-${params.dayIndex}-${slotIndex}`,
      ymd: params.ymd,
      time,
      station: params.station,
      situation,
    });
  });
}

function clocksForDay<T extends readonly string[]>(clocks: T, dayIndex: number): string[] {
  const count = dayIndex % 3 === 2 ? 3 : 2;
  const start = (dayIndex * 2) % clocks.length;
  const picked: string[] = [];
  for (let i = 0; i < count; i += 1) {
    picked.push(clocks[(start + i) % clocks.length]);
  }
  return picked.sort();
}

function applyRealAppointment(
  scans: TrackingScan[],
  appointments: ClientAppointmentPublic[],
  now: Date,
) {
  const scheduled = scheduledAppointment(appointments);
  if (!scheduled?.scheduledAt) return;
  const when = parseInstant(scheduled.scheduledAt);
  if (!when || when.getTime() > now.getTime()) return;

  const delivery = scans.find((scan) => scan.id === "delivery");
  if (!delivery || delivery.at.getTime() > now.getTime()) return;

  const whenLabel = `${formatTrackingLong(when)} à ${formatTrackingTime(when)}`;
  const name = scheduled.inviteeName?.trim();
  delivery.situation = name
    ? `Rendez-vous confirmé — ${name} — ${whenLabel}`
    : `Rendez-vous confirmé — ${whenLabel}`;
}

function scheduledAppointment(
  appointments: ClientAppointmentPublic[],
): ClientAppointmentPublic | undefined {
  return appointments.find((appointment) => appointment.status === "scheduled" && appointment.scheduledAt);
}

function stationStates(activeId: TrackingStationId): TrackingStationState[] {
  const activeIndex = TRACKING_STATIONS.findIndex((station) => station.id === activeId);
  return TRACKING_STATIONS.map((station, index) => ({
    id: station.id,
    label: station.label,
    hint: station.hint,
    status: index < activeIndex ? "done" : index === activeIndex ? "active" : "pending",
  }));
}

function isFrozen(
  retraction: TrackingScriptInput["retraction"],
  now: Date,
): boolean {
  if (!retraction || retraction.status !== "pending") return false;
  const ends = parseInstant(retraction.endsAt);
  if (!ends) return true;
  return ends.getTime() > now.getTime();
}

function pushAtClock(
  scans: TrackingScan[],
  activation: Date,
  slot: {
    id: string;
    ymd: string;
    time: string;
    station: TrackingStationId;
    situation: string;
  },
) {
  const at = parisDateAt(slot.ymd, slot.time);
  if (at.getTime() < activation.getTime()) return;
  if (!isBusinessHour(at)) return;
  push(scans, { id: slot.id, at, station: slot.station, situation: slot.situation });
}

function push(
  scans: TrackingScan[],
  scan: { id: string; at: Date; station: TrackingStationId; situation: string },
) {
  scans.push({
    ...scan,
    stationLabel: STATION_LABEL[scan.station],
  });
}

function parseInstant(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parisParts(date: Date): {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
} {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const hour = read("hour") === "24" ? "00" : read("hour");
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour,
    minute: read("minute"),
  };
}

function parisYmd(date: Date): string {
  const { year, month, day } = parisParts(date);
  return `${year}-${month}-${day}`;
}

function addYmdDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  const nextYear = utc.getUTCFullYear();
  const nextMonth = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(utc.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function parisDateAt(ymd: string, time: string): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = timeZoneOffsetMs(new Date(utcGuess));
  let utc = utcGuess - offset;
  const corrected = timeZoneOffsetMs(new Date(utc));
  if (corrected !== offset) {
    utc = utcGuess - corrected;
  }
  return new Date(utc);
}

function timeZoneOffsetMs(date: Date): number {
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
  const asUtc = Date.UTC(read("year"), read("month") - 1, read("day"), hour, read("minute"), read("second"));
  return asUtc - date.getTime();
}

function isWeekendYmd(ymd: string): boolean {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(parisDateAt(ymd, "12:00"));
  return weekday === "Sat" || weekday === "Sun";
}

function nextWorkingYmd(ymd: string): string {
  let cursor = ymd;
  while (isWeekendYmd(cursor)) {
    cursor = addYmdDays(cursor, 1);
  }
  return cursor;
}

function isBusinessHour(date: Date): boolean {
  const { hour, minute } = parisParts(date);
  const minutes = Number(hour) * 60 + Number(minute);
  return minutes >= BUSINESS_OPEN && minutes <= BUSINESS_CLOSE;
}
