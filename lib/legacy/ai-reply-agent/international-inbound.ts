const INTERNATIONAL_EMAIL_TLD = /\.(be|ch|ca)$/i;

const INTERNATIONAL_GEO_KEYWORDS = [
  "belgique",
  "belge",
  "bruxelles",
  "brussels",
  "suisse",
  "switzerland",
  "genève",
  "geneve",
  "canada",
  "montréal",
  "montreal",
  "hors france",
  "hors-france",
  "concerne aussi",
  "cela concerne",
  "pour la france",
  "en france non",
  "annonces pour la france",
  "répertorie des annonces",
  "repertorie des annonces",
];

const INTERNATIONAL_GEO_QUESTION_KEYWORDS = [
  "france",
  "belgique",
  "belge",
  "suisse",
  "canada",
  "hors france",
  "concerne aussi",
  "cela concerne",
  "répertorie",
  "repertorie",
  "annonces",
];

const PRICING_ACCEPTANCE_KEYWORDS = [
  "j'accepte les tarif",
  "j accepte les tarif",
  "accepte les tarif",
  "accepte ces tarif",
  "j'accepte la tarif",
  "j accepte la tarif",
  "ok pour 1 499",
  "ok pour 1499",
  "ok pour les tarif",
  "d'accord pour les tarif",
  "d accord pour les tarif",
  "d'accord pour 1 499",
  "d accord pour 1 499",
  "je confirme et accepte",
  "je confirme les tarif",
  "confirmes les tarif",
  "accepte le tarif de 1 499",
  "accepte le tarif de 1499",
];

const IMPLICIT_FREE_KEYWORDS = [
  "gratuit",
  "free",
  "sans frais",
  "sans engagement",
  "c'était gratuit",
  "c etait gratuit",
  "je pensais que c'était gratuit",
  "je pensais que c etait gratuit",
];

function inboundProbe(text: string): string {
  const trimmed = text.trim();
  if (!trimmed || trimmed === "(empty body)") {
    return "";
  }
  const withoutQuotedThread = trimmed.split(/\n>{1,2}\s/m)[0]?.trim() ?? trimmed;
  return withoutQuotedThread.toLowerCase();
}

function emailDomain(email: string | null | undefined): string {
  const normalized = (email ?? "").trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at < 0) {
    return "";
  }
  return normalized.slice(at);
}

export function inboundLooksLikeInternationalLead(
  text: string,
  email?: string | null,
): boolean {
  if (INTERNATIONAL_EMAIL_TLD.test(emailDomain(email))) {
    return true;
  }
  const probe = inboundProbe(text);
  if (!probe) {
    return false;
  }
  return INTERNATIONAL_GEO_KEYWORDS.some((keyword) => probe.includes(keyword));
}

export function inboundLooksLikeInternationalGeoQuestion(
  text: string,
  email?: string | null,
): boolean {
  if (!inboundLooksLikeInternationalLead(text, email)) {
    return false;
  }
  const probe = inboundProbe(text);
  if (probe.includes("?")) {
    return true;
  }
  return INTERNATIONAL_GEO_QUESTION_KEYWORDS.some((keyword) => probe.includes(keyword));
}

export function threadMentionedInternationalPricing(threadText: string): boolean {
  const probe = (threadText ?? "").toLowerCase();
  if (!probe.trim()) {
    return false;
  }
  const hasPricing =
    probe.includes("1 499") ||
    probe.includes("1499") ||
    probe.includes("400 usd") ||
    probe.includes("400/mois") ||
    probe.includes("400 / mois");
  if (!hasPricing) {
    return false;
  }
  return (
    probe.includes("usd") ||
    probe.includes("belgique") ||
    probe.includes("suisse") ||
    probe.includes("canada") ||
    probe.includes("international") ||
    probe.includes("infrastructure sur mesure") ||
    probe.includes("échange 1:1") ||
    probe.includes("echange 1:1") ||
    probe.includes("acceptez ces tarifications")
  );
}

export function inboundExplicitlyAcceptsInternationalPricing(text: string): boolean {
  const probe = inboundProbe(text);
  if (!probe) {
    return false;
  }
  if (IMPLICIT_FREE_KEYWORDS.some((keyword) => probe.includes(keyword))) {
    return false;
  }
  if (PRICING_ACCEPTANCE_KEYWORDS.some((keyword) => probe.includes(keyword))) {
    return true;
  }
  if (/accepte.*(?:1499|1\s*499|400)/i.test(probe)) {
    return true;
  }
  return (
    probe.includes("j'accepte") &&
    (probe.includes("tarif") || probe.includes("1499") || probe.includes("1 499"))
  );
}

export function inboundWantsInternationalExchangeWithoutPricingAcceptance(
  text: string,
): boolean {
  const probe = inboundProbe(text);
  if (!probe) {
    return false;
  }
  if (inboundExplicitlyAcceptsInternationalPricing(text)) {
    return false;
  }
  const exchangeSignals = [
    "je souhaite échanger",
    "je souhaite echanger",
    "pour échanger",
    "pour echanger",
    "souhaiterais échanger",
    "souhaiterais echanger",
    "volontiers pour échanger",
    "avec plaisir pour échanger",
  ];
  return exchangeSignals.some((signal) => probe.includes(signal));
}

export function canIssueInternational1to1Link(params: {
  inboundText: string;
  threadContext?: string | null;
}): boolean {
  if (!inboundExplicitlyAcceptsInternationalPricing(params.inboundText)) {
    return false;
  }
  return threadMentionedInternationalPricing(params.threadContext ?? "");
}
