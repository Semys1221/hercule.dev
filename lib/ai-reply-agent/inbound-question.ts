const PHONE_REQUEST_KEYWORDS = [
  "téléphone",
  "telephone",
  "appeler",
  "appel ",
  "contacter",
  "contactez",
  "formulaire",
  "numéro",
  "numero",
  "joignable",
  "rappeler",
];

const INTEREST_KEYWORDS = [
  "intéressé",
  "interesse",
  "d'accord",
  "d accord",
  "je suis ouvert",
  "mon cabinet est compatible",
  "peut être intéressé",
  "peut etre interesse",
  "cela peut m'intéresser",
  "cela peut m interesser",
  "avec plaisir",
  "volontiers",
  "pour échanger",
  "pour echanger",
  "échanger sur le sujet",
  "echanger sur le sujet",
  "effectivement",
];

const BOOKING_CLAIM_KEYWORDS = [
  "j'ai réservé",
  "j ai réservé",
  "j'ai book",
  "j ai book",
  "créneau réservé",
  "creneau reserve",
  "rdv pris",
  "rendez-vous pris",
  "rendez vous pris",
  "réservation effectuée",
  "reservation effectuee",
  "j'ai pris rendez",
  "j ai pris rendez",
  "calendly confirmé",
  "calendly confirme",
  "j'ai choisi un créneau",
  "j ai choisi un creneau",
];

const VERIFICATION_KEYWORDS = [
  "identifier",
  "identité",
  "identite",
  "vérif",
  "verif",
  "coordonnées professionnelles",
  "coordonnees professionnelles",
  "qui êtes-vous",
  "qui etes-vous",
  "quelle société",
  "quelle societe",
  "origine de cette sollicitation",
  "vous représenter",
  "vous representer",
  "pas de confiance",
  "ne vous fais pas confiance",
];

/** French mobile/landline in body (07 80 99 48 70, +33 7..., 06.12.34.56.78). */
const FRENCH_PHONE_PATTERN =
  /\b(?:0[1-9]|\+33[\s.]?[1-9])(?:[\s.\-]?\d{2}){4}\b/;

const SCHEDULING_ANSWER_KEYWORDS = [
  "disponib",
  "demain",
  "matin",
  "après-midi",
  "apres-midi",
  "aprem",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

const QUESTION_KEYWORDS = [
  "comment",
  "pourquoi",
  "explique",
  "expliquer",
  "problématique",
  "problematique",
  "téléphone",
  "telephone",
  "tarif",
  "mensualité",
  "mensualite",
  "collaborateur",
  "associé",
  "associe",
  "éligib",
  "eligib",
  "capacité",
  "capacite",
  "bande passante",
  "visio",
  "formulaire",
  "combien",
  "coûte",
  "coute",
  "fonctionne",
  "précision",
  "precision",
  "détail",
  "detail",
  "apporteur",
  "rémun",
  "remun",
  "commission",
  "sous-trait",
  "sous trait",
  // Link / access requests (conference Zoom, Calendly, etc.)
  "lien",
  "link",
  "connexion",
  "connection",
  "connecter",
  "accès",
  "acces",
  "invitation",
  "rejoindre",
];

const REQUEST_PHRASES = [
  "je veux",
  "j'ai besoin",
  "j ai besoin",
  "pas reçu",
  "pas recu",
  "n'ai pas reçu",
  "n ai pas recu",
  "envoyez",
  "envoyer",
  "transmettre",
  "transmettez",
];

function inboundProbe(text: string): string {
  const trimmed = text.trim();
  if (!trimmed || trimmed === "(empty body)") {
    return "";
  }
  const withoutQuotedThread = trimmed.split(/\n>{1,2}\s/m)[0]?.trim() ?? trimmed;
  return withoutQuotedThread.toLowerCase();
}

/** Cabinet asks for phone / refuses online form — suggest Calendly slots. */
export function inboundLooksLikePhoneRequest(text: string): boolean {
  const probe = inboundProbe(text);
  if (!probe) {
    return false;
  }
  return PHONE_REQUEST_KEYWORDS.some((keyword) => probe.includes(keyword));
}

/** Cabinet answers with availability — try auto-booking. */
export function inboundLooksLikeSchedulingAnswer(text: string): boolean {
  const probe = inboundProbe(text);
  if (!probe) {
    return false;
  }
  if (/\d{1,2}\s*h/.test(probe)) {
    return true;
  }
  return SCHEDULING_ANSWER_KEYWORDS.some((keyword) => probe.includes(keyword));
}

/** True when the inbound likely asks something the prior auto-reply did not answer. */
export function inboundLooksLikeQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed === "(empty body)") {
    return false;
  }

  const probe = inboundProbe(trimmed);
  if (!probe) {
    return false;
  }

  if (probe.includes("?")) {
    return true;
  }

  if (QUESTION_KEYWORDS.some((keyword) => probe.includes(keyword))) {
    return true;
  }

  return REQUEST_PHRASES.some((phrase) => probe.includes(phrase));
}

/** Lead shares a callable phone number in the inbound body. */
export function inboundProvidesPhoneNumber(text: string): boolean {
  const probe = inboundProbe(text);
  if (!probe) {
    return false;
  }
  return FRENCH_PHONE_PATTERN.test(probe);
}

/** Lead signals interest or agreement worth answering after a recent Hercule send. */
export function inboundShowsInterest(text: string): boolean {
  const probe = inboundProbe(text);
  if (!probe) {
    return false;
  }
  return INTEREST_KEYWORDS.some((keyword) => probe.includes(keyword));
}

/** Lead states they already booked — do not ask again for confirmation. */
export function inboundClaimsBookingDone(text: string): boolean {
  const probe = inboundProbe(text);
  if (!probe) {
    return false;
  }
  return BOOKING_CLAIM_KEYWORDS.some((keyword) => probe.includes(keyword));
}

/** Lead asks to verify Hercule identity before continuing. */
export function inboundRequestsVerification(text: string): boolean {
  const probe = inboundProbe(text);
  if (!probe) {
    return false;
  }
  return VERIFICATION_KEYWORDS.some((keyword) => probe.includes(keyword));
}

function inboundIsShortRefusal(text: string): boolean {
  const probe = inboundProbe(text);
  if (!probe) {
    return false;
  }
  const firstLine = probe.split("\n")[0]?.trim() ?? probe;
  return (
    /^(non|nope|pas intéressé|pas interesse)\b/.test(firstLine) &&
    firstLine.length < 40
  );
}

/**
 * True when an inbound deserves a reply agent response even if Hercule
 * sent in-thread within the collision window.
 */
export function inboundNeedsFollowUp(text: string): boolean {
  if (inboundIsShortRefusal(text)) {
    return false;
  }
  return (
    inboundLooksLikeQuestion(text) ||
    inboundLooksLikePhoneRequest(text) ||
    inboundLooksLikeSchedulingAnswer(text) ||
    inboundProvidesPhoneNumber(text) ||
    inboundShowsInterest(text) ||
    inboundRequestsVerification(text)
  );
}
