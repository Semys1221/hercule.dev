import {
  buildEntreprisePostBookingUrl,
  getConfirmBaseUrl,
  getEntreprisePostBookingBaseUrl,
} from "@/lib/link-tracking/urls";
import type { LeadCategory } from "@/lib/link-tracking/types";
import {
  modalitesAskBody,
  modalitesCancelBody,
  MODALITES_SUBJECT,
} from "@/lib/modalites-campaign/copy";

import type { BookingEmailType } from "./types";

const DEFAULT_TEMPORARY_BASE =
  "https://www.hercule.dev/temporary-reservation.html";
const DEFAULT_FROM = "Hercule <contact@hercule.dev>";

export {
  buildEntreprisePostBookingUrl,
  getEntreprisePostBookingBaseUrl,
};

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
    subject: "",
    body: `{{firstNameLine}}

Nous avons le plaisir de vous informer que les profils présentés lors de votre rendez-vous contiendront des contrats de conseil financier.

Afin de maintenir votre créneau, merci de confirmer votre présence :
{{confirmation_agence_link}}

Sans confirmation sous 24 heures, votre place pourra être réattribué à une autre agence.`,
  },
  h24_relance: {
    subject: "",
    body: `{{firstNameLine}}

Nous n'avons pas encore reçu votre confirmation de présence.

Votre créneau sera prochainement libéré dans les heures qui suivent afin de pouvoir être proposé à une autre agence.

Si vous souhaitez maintenir le rendez-vous, merci de nous confirmer votre présence :
{{confirmation_agence_link}}`,
  },
  h20_cancel: {
    subject: "",
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
    subject: "",
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

Prochaine étape : complétez votre onboarding pour démarrer la recherche de contrats.

Accédez à votre tableau de bord :
{{dashboardLink}}

Votre facture a été émise — vous la recevrez d'ici peu.

L'équipe Hercule`,
  },
  upsell_email_1: {
    subject: "Offre Hercule — 1 489 € ou pack 3 mois",
    body: `{{firstNameLine}}

Suite à notre échange, voici les deux formules pour activer Hercule et recevoir des contrats.

Formule mensuelle : 1 489 € / mois, sans engagement.
Pack 3 mois : 989 € / mois (soit 2 967 € payés d'avance, 15 Attributions).

Finalisez depuis votre tableau de bord :
{{dashboardLink}}

L'équipe Hercule`,
  },
  upsell_email_2: {
    subject: "",
    body: `{{firstNameLine}}

Un rappel concernant les formules évoquées lors de notre échange :

• 1 489 € / mois (sans engagement)
• 989 € / mois × 3 mois (2 967 €, 15 Attributions)

Votre tableau de bord reste disponible pour finaliser votre choix :
{{dashboardLink}}

L'équipe Hercule`,
  },
  upsell_email_3: {
    subject: "",
    body: `{{firstNameLine}}

Dernier rappel pour activer Hercule et démarrer la réception de contrats.

Formule mensuelle : 1 489 € / mois.
Pack 3 mois : 989 € / mois (2 967 €, 15 Attributions).

{{dashboardLink}}

L'équipe Hercule`,
  },
  close_indecis_1: {
    subject: "Votre lien pour finaliser le paiement Hercule",
    body: `{{firstNameLine}}

Suite à notre échange, voici le lien pour finaliser le paiement et démarrer votre onboarding Hercule :

{{dashboardLink}}

Si vous avez une question avant de valider, répondez simplement à cet email.

L'équipe Hercule`,
  },
  close_indecis_2: {
    subject: "",
    body: `{{firstNameLine}}

Votre accès Hercule est prêt à être activé. Il ne reste plus qu'à finaliser le paiement depuis votre tableau de bord :

{{dashboardLink}}

Nous restons disponibles si vous souhaitez éclaircir un point avant de valider.

L'équipe Hercule`,
  },
  close_indecis_3: {
    subject: "",
    body: `{{firstNameLine}}

Dernier rappel : votre lien de paiement reste actif pour lancer l'onboarding et recevoir vos premiers contrats.

{{dashboardLink}}

L'équipe Hercule`,
  },
  no_show_indecis_1: {
    subject: "Absence — reprenez un créneau avec Hercule",
    body: `{{firstNameLine}}

Nous n'avons pas pu vous joindre lors de votre rendez-vous avec Hercule.

Pour en planifier un nouveau, utilisez votre lien personnel :
{{reservation_agence_link}}

L'équipe Hercule`,
  },
  no_show_indecis_2: {
    subject: "",
    body: `{{firstNameLine}}

Petit rappel : votre lien de réservation reste actif si vous souhaitez fixer un nouveau créneau.

{{reservation_agence_link}}

L'équipe Hercule`,
  },
  no_show_indecis_3: {
    subject: "",
    body: `{{firstNameLine}}

Dernier rappel : vous pouvez toujours reprendre rendez-vous via ce lien :

{{reservation_agence_link}}

L'équipe Hercule`,
  },
  onboarding_retraction_hold: {
    subject: "Votre délai de rétractation est en cours",
    body: `{{firstNameLine}}

Votre onboarding est bien enregistré. Conformément à nos CGV, vous disposez de 4 jours calendaires pour vous rétracter tant que l'activation n'a pas démarré.

Votre activation est prévue le {{activationDate}}. Pour lancer la recherche immédiatement, rendez-vous sur votre dashboard :

{{dashboardLink}}

L'équipe Hercule`,
  },
  onboarding_j0: {
    subject: "Bienvenue — votre onboarding Hercule est activé",
    body: `{{firstNameLine}}

Votre onboarding est bien enregistré. Nous configurons votre espace et préparons la réception de vos premiers contrats.

Votre tableau de bord :
{{dashboardLink}}

L'équipe Hercule`,
  },
  onboarding_j0_bis: {
    subject: "",
    body: `{{firstNameLine}}

Petit point en fin de journée : votre compte Hercule est configuré, votre calendrier de livraison est enregistré et les demandes correspondant à vos critères peuvent désormais vous être transmises.

Aucune action n'est requise de votre part pour le moment — nous vous préviendrons dès qu'une première demande sera disponible.

{{dashboardLink}}

L'équipe Hercule`,
  },
  onboarding_j1: {
    subject: "",
    body: `{{firstNameLine}}

Nous suivons l'activation de votre compte. Votre premier contrat est en préparation : surveillez votre boîte mail et votre tableau de bord pour ne rien manquer.

{{dashboardLink}}

L'équipe Hercule`,
  },
  onboarding_reminder_m10: {
    subject: "",
    body: `{{firstNameLine}}

Rappel : la première date de livraison estimée est le {{estimatedFirstBookingDate}}.

Votre tableau de bord reste le point central pour suivre l'avancement :
{{dashboardLink}}

L'équipe Hercule`,
  },
  onboarding_reminder_m5: {
    subject: "",
    body: `{{firstNameLine}}

Rappel J-5 : la livraison estimée approche ({{estimatedFirstBookingDate}}).

Consultez votre tableau de bord pour le détail :
{{dashboardLink}}

L'équipe Hercule`,
  },
  onboarding_reminder_p5: {
    subject: "",
    body: `{{firstNameLine}}

Point J+5 après la date estimée ({{estimatedFirstBookingDate}}) : nous vérifions que tout se déroule comme prévu.

{{dashboardLink}}

L'équipe Hercule`,
  },
  deliverance_search_started: {
    subject: "Recherche lancée — Hercule",
    body: `{{firstNameLine}}

La recherche de mise en relation a bien été lancée. Vous pouvez suivre l'avancement étape par étape depuis votre tableau de bord.

{{dashboardLink}}

L'équipe Hercule`,
  },
  deliverance_d7_update: {
    subject: "",
    body: `{{firstNameLine}}

Mise à jour J+7 : la recherche progresse. Consultez votre tableau de bord pour le détail des actions en cours.

{{dashboardLink}}

L'équipe Hercule`,
  },
  deliverance_milestone: {
    subject: "",
    body: `{{firstNameLine}}

Une nouvelle étape de votre recherche vient d'être franchie. Retrouvez le détail sur votre tableau de bord.

{{dashboardLink}}

L'équipe Hercule`,
  },
  deliverance_waitlist: {
    subject: "",
    body: `{{firstNameLine}}

Votre dossier est actuellement en file d'attente. Nous vous préviendrons dès qu'un créneau de livraison se libère.

{{dashboardLink}}

L'équipe Hercule`,
  },
  match_proposal: {
    subject: "Nous vous avons trouvé une agence",
    body: `{{firstNameLine}}

Nous vous proposons une agence correspondant à votre demande.

{{agenceInfo}}

Réservez un créneau pour échanger avec elle :
{{calendlyLink}}

L'équipe Hercule`,
  },
  match_proposal_followup: {
    subject: "",
    body: `{{firstNameLine}}

Nous n'avons pas encore reçu de réservation pour le rendez-vous proposé avec l'agence ci-dessous.

{{agenceInfo}}

Réservez votre créneau ici :
{{calendlyLink}}

L'équipe Hercule`,
  },
  match_booking_agence: {
    subject: "Un rendez-vous a été réservé avec une entreprise",
    body: `{{firstNameLine}}

Une entreprise a réservé un rendez-vous via votre lien Calendly Hercule.

{{entrepriseInfo}}

Date : {{date}} à {{heure}}.

L'équipe Hercule`,
  },
  survey_rdv_entreprise: {
    subject: "Votre avis après le rendez-vous",
    body: `{{firstNameLine}}

Pouvez-vous nous indiquer si l'embarquement avec l'agence s'est bien passé ? Votre retour nous aide à améliorer la qualité des mises en relation.

{{surveyLink}}

L'équipe Hercule`,
  },
  survey_rdv_entreprise_followup: {
    subject: "",
    body: `{{firstNameLine}}

Nous n'avons pas encore reçu votre retour sur le rendez-vous avec l'agence. Quelques minutes suffisent pour compléter le questionnaire :

{{surveyLink}}

L'équipe Hercule`,
  },
  survey_rdv_agence: {
    subject: "Votre avis après le rendez-vous",
    body: `{{firstNameLine}}

Avez-vous conclu une vente suite au rendez-vous ? Indiquez-le via le questionnaire ci-dessous — cela nous permet de mettre à jour votre suivi.

{{surveyLink}}

L'équipe Hercule`,
  },
  survey_rdv_agence_followup: {
    subject: "",
    body: `{{firstNameLine}}

Nous n'avons pas encore reçu votre retour après le rendez-vous. Merci de nous indiquer si une vente a été conclue :

{{surveyLink}}

L'équipe Hercule`,
  },
  sold_check_j7: {
    subject: "Comment s'est passée votre collaboration ?",
    body: `{{firstNameLine}}

Petit point J+7 : le démarrage de votre collaboration avec l'agence s'est-il bien passé ?

Répondez simplement à cet email pour nous le faire savoir — aucun lien n'est nécessaire.

L'équipe Hercule`,
  },
  payment_notification_client: {
    subject: "Confirmation de paiement Hercule",
    body: `{{firstNameLine}}

Nous confirmons la bonne réception de votre paiement. Votre accès Hercule est à jour.

Retrouvez le détail sur votre tableau de bord :
{{dashboardLink}}

L'équipe Hercule`,
  },
  role_seq_24: {
    subject: "",
    body: `{{firstNameLine}}

J'ai le plaisir de vous confirmer que les contrats d'agence présentés lors de votre entretien concerneront des cabinets de conseil financier situés en région Aquitaine et PACA.

Un aperçu du déroulé de votre entretien est disponible ici : {{confirmLink}}`,
  },
  modalites_ask: {
    subject: MODALITES_SUBJECT,
    body: modalitesAskBody("agence"),
  },
  modalites_cancel: {
    subject: "",
    body: modalitesCancelBody(),
  },
};

export const ENTREPRISE_BOOKING_EMAIL_TEMPLATE_OVERRIDES: Partial<
  Record<BookingEmailTemplateType, Omit<BookingEmailTemplateRecord, "email_type">>
> = {
  immediate: {
    subject: "Votre audit de compatibilité Hercule est confirmé",
    body: `{{firstNameLine}}

Votre rendez-vous d'audit de compatibilité avec Hercule est bien confirmé le {{date}} à {{heure}}.

Nous reviendrons ensemble sur votre cabinet, votre zone d'intervention et vos disponibilités pour recevoir de nouvelles missions de tenue PME.

Les informations de connexion vous seront transmises directement par Calendly.`,
  },
  h48_confirm: {
    subject: "Préparez votre audit de compatibilité · Hercule",
    body: ENTREPRISE_H48_BODY,
  },
  h24_relance: {
    subject: "Votre audit Hercule approche",
    body: ENTREPRISE_H24_BODY,
  },
  product_payment_welcome: {
    subject: "Votre accès Hercule Comptable est activé",
    body: `{{firstNameLine}}

Votre paiement a bien été reçu. Votre accès Hercule Comptable est maintenant actif.

L'équipe Hercule configure votre espace dans les prochaines 48 heures :
- Provisionnement de votre compte Calendly Pro
- Provisionnement de votre compte Zoom Pro
- Premier rendez-vous PME planifié sous 15 jours

Retrouvez votre espace cabinet :
{{dashboardLink}}

L'équipe Hercule`,
  },
  modalites_ask: {
    subject: MODALITES_SUBJECT,
    body: modalitesAskBody("entreprise"),
  },
  modalites_cancel: {
    subject: "",
    body: modalitesCancelBody(),
  },
};

export function defaultBookingEmailTemplate(
  category: LeadCategory,
  emailType: BookingEmailTemplateType,
): Omit<BookingEmailTemplateRecord, "email_type"> {
  if (category === "entreprise" || category === "comptable") {
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
    emailType.startsWith("no_show_indecis_") ||
    emailType.startsWith("onboarding_") ||
    emailType.startsWith("deliverance_") ||
    emailType.startsWith("match_") ||
    emailType.startsWith("survey_") ||
    emailType === "sold_check_j7" ||
    emailType === "payment_notification_client" ||
    emailType === "modalites_ask" ||
    emailType === "modalites_cancel"
  ) {
    return trimmed ? `Bonjour ${trimmed},` : "Bonjour,";
  }
  return trimmed ? `${trimmed},` : "Bonjour,";
}

export function getBookingConfirmBaseUrl(): string {
  return getConfirmBaseUrl();
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
