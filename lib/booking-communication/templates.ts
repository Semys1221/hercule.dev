const DEFAULT_CONFIRM_BASE =
  "https://www.hercule.dev/confirm-reservation.html";
const DEFAULT_TEMPORARY_BASE =
  "https://www.hercule.dev/temporary-reservation.html";
const DEFAULT_FROM = "Hercule <contact@hercule.dev>";

export type BookingEmailTemplateType =
  | "immediate"
  | "h48_confirm"
  | "h24_relance"
  | "h20_cancel"
  | "role_seq_48"
  | "role_seq_24";

export type BookingEmailTemplateRecord = {
  email_type: BookingEmailTemplateType;
  subject: string;
  body: string;
};

export const DEFAULT_BOOKING_EMAIL_TEMPLATES: Record<
  BookingEmailTemplateType,
  Omit<BookingEmailTemplateRecord, "email_type">
> = {
  immediate: {
    subject: "Confirmation de votre rendez-vous avec Hercule",
    body: `{{firstNameLine}}

Votre rendez-vous avec Hercule est bien prévu le {{date}} à {{heure}}.

Les informations de connexion vous seront transmises directement par email via Calendly.`,
  },
  h48_confirm: {
    subject: "Confirmation requise — Votre rendez-vous avec Hercule",
    body: `{{firstNameLine}}

Nous avons le plaisir de vous informer que les profils présentés lors de votre rendez-vous porteront sur des contrats de conseil financier.

Afin de maintenir votre créneau, merci de confirmer votre présence :
{{confirmation_agence_link}}

Sans confirmation sous 24 heures, votre place pourra être réattribué à une autre agence.`,
  },
  h24_relance: {
    subject: "Confirmation requise — Votre rendez-vous avec Hercule",
    body: `{{firstNameLine}}

Nous n'avons pas encore reçu votre confirmation de présence.

Votre créneau sera prochainement libéré dans les heures qui suivent afin de pouvoir être proposé à une autre agence.

Si vous souhaitez maintenir le rendez-vous, merci de nous confirmer votre présence :
{{confirmation_agence_link}}`,
  },
  h20_cancel: {
    subject: "Votre rendez-vous avec Hercule est annulé",
    body: `{{firstNameLine}}

Faute de confirmation de votre part, votre rendez-vous prévu le {{date}} à {{heure}} a été annulé.

Votre créneau a été libéré et pourra être proposé à une autre agence.`,
  },
  role_seq_48: {
    subject: "Hercule — avant votre rendez-vous",
    body: `{{firstNameLine}}

Le principe d'Hercule tient en quelques mots.

La crainte des entreprises que nous auditons est simple : ne pas savoir si les recommandations d'une agence sont réellement adaptées à leur activité.

C'est précisément là qu'Hercule prend son sens : faire ce tri et orienter chaque entreprise vers ce qui lui correspond réellement.

Nous en parlerons ensemble au rendez-vous.`,
  },
  role_seq_24: {
    subject: "Confirmer votre créneau — Hercule",
    body: `{{firstNameLine}}

J'ai le plaisir de vous confirmer que les contrats d'agence présentés lors de votre entretien concerneront des cabinets de conseil financier situés en région Aquitaine et PACA.

Un aperçu du déroulé de votre entretien est disponible ici : {{confirmLink}}`,
  },
};

export function renderTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export function buildFirstNameLine(
  firstName: string | null,
  emailType: BookingEmailTemplateType = "h48_confirm",
): string {
  const trimmed = firstName?.trim();
  if (emailType === "immediate") {
    return trimmed ? `Bonjour ${trimmed},` : "Bonjour,";
  }
  return trimmed ? `${trimmed},` : "Bonjour,";
}

export function getBookingConfirmBaseUrl(): string {
  return (
    process.env.BOOKING_CONFIRM_BASE_URL?.trim().replace(/\/$/, "") ??
    DEFAULT_CONFIRM_BASE
  );
}

export function getTemporaryReservationBaseUrl(): string {
  return (
    process.env.BOOKING_TEMPORARY_BASE_URL?.trim().replace(/\/$/, "") ??
    DEFAULT_TEMPORARY_BASE
  );
}

export function getBookingFromAddress(): string {
  return (
    process.env.BOOKING_RESEND_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    DEFAULT_FROM
  );
}

export function buildConfirmUrl(slug: string, email: string): string {
  const url = new URL(`${getBookingConfirmBaseUrl()}/${slug}`);
  url.searchParams.set("email", email);
  return url.toString();
}

export function buildTemporaryConfirmUrl(slug: string, email: string): string {
  const url = new URL(`${getTemporaryReservationBaseUrl()}/${slug}`);
  url.searchParams.set("email", email);
  return url.toString();
}

export function formatMeetingDateTime(iso: string | null): {
  date: string;
  heure: string;
} {
  if (!iso) {
    return { date: "la date convenue", heure: "l'heure convenue" };
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return { date: "la date convenue", heure: "l'heure convenue" };
  }
  const date = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(parsed);
  const heure = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(parsed);
  return { date, heure };
}

/** Immediate confirmation — template 1 from doc/emails_booking. */
export function renderImmediateEmail(params: {
  firstName: string | null;
  scheduledAt: string | null;
}): { subject: string; text: string } {
  const { date, heure } = formatMeetingDateTime(params.scheduledAt);
  const defaults = DEFAULT_BOOKING_EMAIL_TEMPLATES.immediate;
  const vars = {
    firstNameLine: buildFirstNameLine(params.firstName, "immediate"),
    date,
    heure,
  };
  return {
    subject: defaults.subject,
    text: renderTemplate(defaults.body, vars),
  };
}

/** 48h confirmation request — template 2 from doc/emails_booking. */
export function renderH48ConfirmEmail(params: {
  firstName: string | null;
  confirmUrl: string;
}): { subject: string; text: string } {
  const defaults = DEFAULT_BOOKING_EMAIL_TEMPLATES.h48_confirm;
  const vars = {
    firstNameLine: buildFirstNameLine(params.firstName, "h48_confirm"),
    confirmUrl: params.confirmUrl,
    confirmation_agence_link: params.confirmUrl,
  };
  return {
    subject: defaults.subject,
    text: renderTemplate(defaults.body, vars),
  };
}

/** 24h relance if still unconfirmed — same confirm template family. */
export function renderH24RelanceEmail(params: {
  firstName: string | null;
  confirmUrl: string;
}): { subject: string; text: string } {
  const defaults = DEFAULT_BOOKING_EMAIL_TEMPLATES.h24_relance;
  const vars = {
    firstNameLine: buildFirstNameLine(params.firstName, "h48_confirm"),
    confirmUrl: params.confirmUrl,
    confirmation_agence_link: params.confirmUrl,
  };
  return {
    subject: defaults.subject,
    text: renderTemplate(defaults.body, vars),
  };
}
