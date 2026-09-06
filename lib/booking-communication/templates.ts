import type { BookingEmailType } from "./types";

const DEFAULT_CONFIRM_BASE =
  "https://www.hercule.dev/confirm-reservation.html";
const DEFAULT_TEMPORARY_BASE =
  "https://www.hercule.dev/temporary-reservation.html";
const DEFAULT_ENTREPRISE_POST_BASE =
  "https://www.hercule.dev/post-booking-entreprise.html";
const DEFAULT_FROM = "Hercule <contact@hercule.dev>";

export type BookingEmailTemplateType = BookingEmailType;

export type BookingEmailTemplateRecord = {
  email_type: BookingEmailTemplateType;
  subject: string;
  body: string;
};

const ENTREPRISE_H48_BODY = `{{firstNameLine}}

Pour préparer au mieux votre rendez-vous, retrouvez ici le déroulé de votre échange :
{{post_booking_link}}`;

const ENTREPRISE_H24_BODY = `{{firstNameLine}}

Votre rendez-vous avec Hercule approche — il est prévu le {{date}} à {{heure}}.

Nous avons hâte d'échanger avec vous.`;

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

Nous avons le plaisir de vous informer que les profils présentés lors de votre rendez-vous contiendront des contrats de conseil financier.

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
  product_calendly_welcome: {
    subject: "Bienvenue chez Hercule — prochaine étape Calendly",
    body: `{{firstNameLine}}

Merci pour votre confiance. Votre paiement est bien confirmé.

Dans les prochaines heures, vous recevrez une invitation Calendly sur {{email}} pour accéder à votre espace Hercule et configurer votre agenda de livraison.

En attendant, vous pouvez consulter votre tableau de bord ici :
{{dashboardLink}}

À très vite,
L'équipe Hercule`,
  },
  product_calendly_reminder: {
    subject: "Rappel — acceptez votre invitation Calendly",
    body: `{{firstNameLine}}

Nous n'avons pas encore vu votre invitation Calendly acceptée pour {{email}}.

Merci de vérifier votre boîte mail (et vos spams) et d'accepter l'invitation pour activer votre accès Calendly.

Si vous n'avez pas reçu l'invitation, répondez à cet email ou contactez-nous à contact@hercule.dev.

Votre tableau de bord : {{dashboardLink}}`,
  },
  product_payment_welcome: {
    subject: "Votre accès Hercule est activé",
    body: `{{firstNameLine}}

Votre paiement a bien été reçu. Votre accès Hercule est maintenant actif.

Prochaine étape : complétez votre onboarding pour démarrer la recherche de demandes qualifiées.

Accédez à votre tableau de bord :
{{dashboardLink}}

Votre facture a été émise — vous la recevrez d'ici peu.

L'équipe Hercule`,
  },
  upsell_email_1: {
    subject: "Offre Hercule — 1 489 € ou 998 €",
    body: `{{firstNameLine}}

Suite à notre échange, voici les deux formules pour activer Hercule.

Formule complète : 1 489 €.
Offre 3 mois : 998 €.

Finalisez depuis votre tableau de bord :
{{dashboardLink}}`,
  },
  upsell_email_2: {
    subject: "Rappel — activer Hercule",
    body: `{{firstNameLine}}

Un rappel concernant les deux formules évoquées : 1 489 € ou 998 € (3 mois).

Votre tableau de bord :
{{dashboardLink}}`,
  },
  upsell_email_3: {
    subject: "Dernier rappel — offre Hercule",
    body: `{{firstNameLine}}

Dernier rappel pour activer Hercule (1 489 € ou 998 €).

{{dashboardLink}}`,
  },
  close_indecis_1: {
    subject: "Votre lien pour finaliser le paiement Hercule",
    body: `{{firstNameLine}}

Voici le lien pour finaliser le paiement et démarrer l'onboarding :
{{dashboardLink}}`,
  },
  close_indecis_2: {
    subject: "Rappel — finaliser votre paiement Hercule",
    body: `{{firstNameLine}}

Votre tableau de bord est toujours disponible pour finaliser le paiement :
{{dashboardLink}}`,
  },
  close_indecis_3: {
    subject: "Dernier rappel — accès Hercule",
    body: `{{firstNameLine}}

Dernier rappel pour finaliser le paiement et lancer l'onboarding :
{{dashboardLink}}`,
  },
  onboarding_j0: {
    subject: "Bienvenue — votre onboarding Hercule est activé",
    body: `{{firstNameLine}}

Votre onboarding est bien enregistré. La recherche de demandes peut démarrer.

Tableau de bord :
{{dashboardLink}}`,
  },
  onboarding_j0_bis: {
    subject: "Hercule — prochaine étape après onboarding",
    body: `{{firstNameLine}}

Petit point en fin de journée : votre espace Hercule est prêt.

{{dashboardLink}}`,
  },
  onboarding_j1: {
    subject: "Suivi J+1 — activation Hercule",
    body: `{{firstNameLine}}

Nous suivons l'activation de votre compte. Votre tableau de bord :
{{dashboardLink}}`,
  },
  onboarding_reminder_m10: {
    subject: "Rappel J-10 — première livraison Hercule",
    body: `{{firstNameLine}}

Rappel : la première date de livraison estimée est le {{estimatedFirstBookingDate}}.

{{dashboardLink}}`,
  },
  onboarding_reminder_m5: {
    subject: "Rappel J-5 — première livraison Hercule",
    body: `{{firstNameLine}}

Rappel J-5 : livraison estimée le {{estimatedFirstBookingDate}}.

{{dashboardLink}}`,
  },
  onboarding_reminder_p5: {
    subject: "Rappel J+5 — suivi première livraison",
    body: `{{firstNameLine}}

Point J+5 après la date estimée ({{estimatedFirstBookingDate}}).

{{dashboardLink}}`,
  },
  deliverance_search_started: {
    subject: "Recherche lancée — Hercule",
    body: `{{firstNameLine}}

La recherche de mise en relation a bien été lancée.

{{dashboardLink}}`,
  },
  deliverance_d7_update: {
    subject: "Mise à jour J+7 — recherche Hercule",
    body: `{{firstNameLine}}

Mise à jour J+7 de la recherche en cours.

{{dashboardLink}}`,
  },
  deliverance_milestone: {
    subject: "Avancement — étape de délivrance Hercule",
    body: `{{firstNameLine}}

Une étape de délivrance vient d'avancer.

{{dashboardLink}}`,
  },
  deliverance_waitlist: {
    subject: "File d'attente — Hercule",
    body: `{{firstNameLine}}

Votre dossier est actuellement en file d'attente.

{{dashboardLink}}`,
  },
  match_proposal: {
    subject: "Nous vous avons trouvé une agence",
    body: `{{firstNameLine}}

Nous vous proposons une agence pour votre projet.

{{agenceInfo}}

Réservez un créneau :
{{calendlyLink}}`,
  },
  match_proposal_followup: {
    subject: "Rappel — réserver votre rendez-vous agence",
    body: `{{firstNameLine}}

Nous n'avons pas encore de réservation pour le rendez-vous proposé.

{{agenceInfo}}

{{calendlyLink}}`,
  },
  match_booking_agence: {
    subject: "Un rendez-vous a été réservé avec une entreprise",
    body: `{{firstNameLine}}

Une entreprise a réservé un rendez-vous via votre lien Calendly.

{{entrepriseInfo}}

Date : {{date}} à {{heure}}.`,
  },
  survey_rdv_entreprise: {
    subject: "Votre avis après le rendez-vous",
    body: `{{firstNameLine}}

Pouvez-vous indiquer si l'embarquement avec l'agence s'est bien passé ?

{{surveyLink}}`,
  },
  survey_rdv_entreprise_followup: {
    subject: "Rappel — questionnaire post-rendez-vous",
    body: `{{firstNameLine}}

Nous n'avons pas encore reçu votre retour.

{{surveyLink}}`,
  },
  survey_rdv_agence: {
    subject: "Votre avis après le rendez-vous",
    body: `{{firstNameLine}}

Avez-vous conclu une vente suite au rendez-vous ?

{{surveyLink}}`,
  },
  survey_rdv_agence_followup: {
    subject: "Rappel — questionnaire post-rendez-vous",
    body: `{{firstNameLine}}

Nous n'avons pas encore reçu votre retour.

{{surveyLink}}`,
  },
  sold_check_j7: {
    subject: "Votre onboarding s'est-il bien passé ?",
    body: `{{firstNameLine}}

Petit point J+7 : votre onboarding avec l'agence s'est-il bien passé ?

{{dashboardLink}}`,
  },
  payment_notification_client: {
    subject: "Confirmation de paiement Hercule",
    body: `{{firstNameLine}}

Nous confirmons la réception de votre paiement.

{{dashboardLink}}`,
  },
  role_seq_24: {
    subject: "Confirmer votre créneau — Hercule",
    body: `{{firstNameLine}}

J'ai le plaisir de vous confirmer que les contrats d'agence présentés lors de votre entretien concerneront des cabinets de conseil financier situés en région Aquitaine et PACA.

Un aperçu du déroulé de votre entretien est disponible ici : {{confirmLink}}`,
  },
};

export const ENTREPRISE_BOOKING_EMAIL_TEMPLATE_OVERRIDES: Partial<
  Record<BookingEmailTemplateType, Omit<BookingEmailTemplateRecord, "email_type">>
> = {
  h48_confirm: {
    subject: "Préparez votre rendez-vous avec Hercule",
    body: ENTREPRISE_H48_BODY,
  },
  h24_relance: {
    subject: "Rappel — Votre rendez-vous avec Hercule approche",
    body: ENTREPRISE_H24_BODY,
  },
};

export function defaultBookingEmailTemplate(
  category: "agence" | "entreprise",
  emailType: BookingEmailTemplateType,
): Omit<BookingEmailTemplateRecord, "email_type"> {
  if (category === "entreprise") {
    const override = ENTREPRISE_BOOKING_EMAIL_TEMPLATE_OVERRIDES[emailType];
    if (override) {
      return override;
    }
  }
  return DEFAULT_BOOKING_EMAIL_TEMPLATES[emailType];
}

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
  if (
    emailType === "immediate" ||
    emailType === "product_calendly_welcome" ||
    emailType === "product_calendly_reminder" ||
    emailType === "product_payment_welcome" ||
    emailType.startsWith("upsell_") ||
    emailType.startsWith("close_indecis_") ||
    emailType.startsWith("onboarding_") ||
    emailType.startsWith("deliverance_") ||
    emailType.startsWith("match_") ||
    emailType.startsWith("survey_") ||
    emailType === "sold_check_j7" ||
    emailType === "payment_notification_client"
  ) {
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

export function getEntreprisePostBookingBaseUrl(): string {
  return (
    process.env.BOOKING_ENTREPRISE_POST_BASE_URL?.trim().replace(/\/$/, "") ??
    DEFAULT_ENTREPRISE_POST_BASE
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

export function buildEntreprisePostBookingUrl(slug: string, email: string): string {
  const url = new URL(`${getEntreprisePostBookingBaseUrl()}/${slug}`);
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
