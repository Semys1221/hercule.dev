const PHONE_REQUEST_KEYWORDS = [
  "téléphone",
  "telephone",
  "appeler",
  "appel ",
  "formulaire",
  "numéro",
  "numero",
  "joignable",
  "rappeler",
];

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

  return QUESTION_KEYWORDS.some((keyword) => probe.includes(keyword));
}
